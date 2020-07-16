/*global m _ comp state tds db hari ors look lookUser makeModal lookReferences withThis updateBoth autoForm schemas selects*/

/*
  TODOS:
  - integrasi soapView soapPdf (ok)
  - integrasi cashier
  - intermediat konfirmasi (ok)
*/

_.assign(comp, {
  laboratory: () => m('.content',
    m('h1', 'Laboratorium'),
    m('table.table',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.patients.filter(i =>
          // TODO: lakukan juga untuk rawatInap
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.labor') &&
            // cari pada array labor yang salah satunya belum ada hasil
            j.soapDokter.labor.filter(k => k.hasil).length <
            j.soapDokter.labor.length
          ).length
        ).toArray(arr => state.laboratoryList = arr.flatMap(i =>
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.labor') &&
            j.soapDokter.labor.filter(k => k.hasil).length <
            j.soapDokter.labor.length
          ).map(j => ({pasien: i, rawat: j}))
        ))
      ]},
      m('thead', m('tr',
        ['Waktu Permintaan', 'No. MR', 'Nama Pasien', 'Instalasi', 'Dokter', 'Diproses']
        .map(i => m('th', i))
      )),
      // berbeda dengan radiologi, 1 baris mewakili 1 kali rawat
      m('tbody',
        (state.laboratoryList || []).map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'responLaboratory', responLaboratory: _.assign(
              i, {labor: _.get(i, 'rawat.soapDokter.labor')}
            )
          }) && m.redraw()},
          tds([
            hari(i.rawat.tanggal),
            i.pasien.identitas.no_mr,
            i.pasien.identitas.nama_lengkap,
            ors([
              i.rawat.klinik && look('klinik', i.rawat.klinik),
              i.observasi && 'Rawat Inap',
              'Emergency'
            ]),
            lookUser(i.rawat.soapDokter.dokter),
            withThis(
              i.rawat.soapDokter.labor.find(j => j.tanggal),
              tanggal => hari(tanggal, true)
            )
          ])
        ))
      )
    )
  ),
  responLaboratory: () => m('.content',
    m('h2', 'Respon Laboratorium'),
    m(autoForm({
      id: 'responLaboratory',
      schema: _.merge({},
        schemas.responLaboratory,
        // cek apakah salah satu item labor sudah dikonfirmasi
        state.responLaboratory.labor.filter(i => i.konfirmasi).length ?
        // jika salah satu sudah dikonfirmasi maka buka form isian hasil
        {'labor.$.hasil': {type: String}} :
        // jika belum ada yg dikonfirmasi pada array labor, konfirmasi dulu
        {'labor.$.konfirmasi': {
          type: Number, autoform: {
            type: 'select', options: selects('konfirmasi')
          }
        }}
      ),
      doc: {labor: state.responLaboratory.labor},
      action: doc => [
        updateBoth(
          'patients', state.responLaboratory.pasien._id,
          _.assign(state.responLaboratory.pasien, {
            rawatJalan: (state.responLaboratory.pasien.rawatJalan || []).map(
              i => i.idrawat === state.responLaboratory.rawat.idrawat ?
              _.assign(i, {soapDokter: _.assign(
                state.responLaboratory.rawat.soapDokter,
                {labor: state.responLaboratory.rawat.soapDokter.labor.map(
                  // cari pada doc.labor pasangannya
                  j => _.assign(j, doc.labor.find(
                    k => k.idlabor === j.idlabor
                  ) || {})
                )}
              )}) : i
            )
          })
        ),
        _.assign(state, {route: 'laboratory', laboratoryList: []}),
        m.redraw()
      ]
    }))
  )
})