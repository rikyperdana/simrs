/*global m _ comp state tds db hari ors look lookUser makeModal lookReferences withThis updateBoth autoForm schemas selects reports makePdf*/

_.assign(comp, {
  laboratory: () => state.login.bidang !== 8
  ? m('p', 'Hanya untuk petugas labor')
  : m('.content',
    state.login.peranan === 4 && reports.laboratory(),
    m('h1', 'Laboratorium'),
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.patients.filter(i => // logicnya berbeda dengan radiologi
          [
            ...(i.rawatJalan || []), ...(i.emergency || []),
            ...(i.rawatInap ? i.rawatInap.flatMap(
              j => (j.observasi || []).map(k => ({soapDokter: k}))
            ) : [])
          ].filter(j =>
            // cari pada array labor yg seluruhnya sudah ada hasil atau ditolak
            _.get(j, 'soapDokter.labor') && j.soapDokter.labor.filter(
              k => k.hasil || (k.konfirmasi === 2)
            ).length !== j.soapDokter.labor.length
          ).length
        ).toArray(arr => state.laboratoryList = arr.flatMap(i =>
          [
            ...(i.rawatJalan || []), ...(i.emergency || []),
            ...(i.rawatInap ? i.rawatInap.flatMap(j => j.observasi.flatMap(
              k => ({inap: j, observasi: k})
            )) : [])
          ]
          .filter(j => ors([
            _.get(j, 'soapDokter.labor') &&
            j.soapDokter.labor.filter(k => k.hasil).length < j.soapDokter.labor.length,
            _.get(j, 'observasi.labor') &&
            j.observasi.labor.filter(k => k.hasil).length < j.observasi.labor.length
          ])).map(j => ors([
            j.soapDokter && {pasien: i, rawat: j},
            j.observasi && _.merge(j, {pasien: i})
          ]))
        ))
      ]},
      m('thead', m('tr',
        ['Waktu Permintaan', 'No. MR', 'Nama Pasien', 'Instalasi', 'Dokter', 'Diproses']
        .map(i => m('th', i))
      )),
      // berbeda dengan radiologi, 1 baris mewakili 1 kali rawat/observasi
      m('tbody',
        (state.laboratoryList || []).map(i => m('tr',
          {onclick: () => _.assign(state, {
            route: 'responLaboratory',
            responLaboratory: _.assign(i, {labor: ors([
              _.get(i, 'rawat.soapDokter.labor'),
              _.get(i, 'observasi.labor')
            ])})
          }) && m.redraw()},
          tds([
            hari(ors([
              _.get(i, 'rawat.tanggal'),
              _.get(i, 'observasi.tanggal')
            ]), true),
            i.pasien.identitas.no_mr,
            i.pasien.identitas.nama_lengkap,
            ors([
              _.get(i, 'rawat.klinik') && look('klinik', i.rawat.klinik),
              i.observasi && 'Rawat Inap',
              'Emergency'
            ]),
            lookUser(ors([
              _.get(i, 'rawat.soapDokter.dokter'),
              _.get(i, 'observasi.dokter')
            ])),
            hari(ors([
              _.get(i, 'rawat.soapDokter.labor') &&
              i.rawat.soapDokter.labor.find(j => j.tanggal),
              _.get(i, 'observasi.labor') &&
              i.observasi.labor.find(j => j.tanggal)
            ]), true)
          ])
        ))
      )
    )))
  ),
  responLaboratory: () => m('.content',
    m('h2', 'Respon Laboratorium'),
    m(autoForm({
      id: 'responLaboratory',
      schema: _.merge({},
        schemas.responLaboratory,
        // cek apakah salah satu item labor sudah dikonfirmasi
        state.responLaboratory.labor.filter(i => i.konfirmasi).length
        // jika salah satu sudah dikonfirmasi maka buka form isian hasil
        ? {'labor.$.hasil': {type: String}}
        // jika belum ada yg dikonfirmasi pada array labor, konfirmasi dulu
        : {'labor.$.konfirmasi': {
          type: Number, autoform: {
            type: 'select', options: selects('konfirmasi')
          }
        }}
      ),
      doc: {labor: state.responLaboratory.labor.filter(i => ors([
        !i.konfirmasi, !i.hasil
      ]))},
      confirmMessage: 'Yakin dengan respon form laboratorium ini?',
      action: doc => [
        updateBoth(
          'patients', state.responLaboratory.pasien._id,
          _.assign(state.responLaboratory.pasien, {
            rawatJalan: (state.responLaboratory.pasien.rawatJalan || []).map(
              i => i.idrawat === _.get(state, 'responLaboratory.rawat.idrawat') ?
              _.assign(i, {soapDokter: _.assign(
                state.responLaboratory.rawat.soapDokter,
                {labor: state.responLaboratory.rawat.soapDokter.labor.map(
                  // cari pada doc.labor pasangannya
                  j => _.assign(j, doc.labor.find(
                    k => k.idlabor === j.idlabor
                  ) || {})
                )}
              )}) : i
            ),
            emergency: (state.responLaboratory.pasien.emergency || []).map(
              i => i.idrawat === _.get(state, 'responLaboratory.rawat.idrawat') ?
              _.assign(i, {soapDokter: _.assign(
                state.responLaboratory.rawat.soapDokter,
                {labor: state.responLaboratory.rawat.soapDokter.labor.map(
                  // cari pada doc.labor pasangannya
                  j => _.assign(j, doc.labor.find(
                    k => k.idlabor === j.idlabor
                  ) || {})
                )}
              )}) : i
            ),
            rawatInap: (state.responLaboratory.pasien.rawatInap || []).map(
              i => i.idinap === _.get(state, 'responLaboratory.inap.idinap') ?
              _.assign(i, {observasi: state.responLaboratory.inap.observasi.map(
                j => j.idobservasi === state.responLaboratory.observasi.idobservasi ?
                _.assign(j, {labor: state.responLaboratory.observasi.labor.map(
                  k => _.assign(k, doc.labor.find(
                    l => l.idlabor === k.idlabor
                  ) || {})
                )}) : j
              )}) : i
            )
          })
        ),
        doc.labor.filter(i => i.hasil).length &&
        makePdf.labor(state.responLaboratory.pasien.identitas, doc.labor),
        _.assign(state, {route: 'laboratory', laboratoryList: []}),
        m.redraw()
      ]
    }))
  )
})
