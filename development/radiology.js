/*global m _ comp db state tds lookUser look makeModal autoForm schemas moment lookReferences hari ors makePdf updateBoth reports*/

_.assign(comp, {
  radiology: () => state.login.bidang !== 9
  ? m('p', 'Hanya untuk petugas radiologi')
  : m('.content',
    state.login.peranan === 4 && reports.radiology(),
    m('h1', 'Radiologi'),
    // tabel untuk melihat daftar request radiologi yang direquest dokter
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () => [
        // siapkan daftar referensi untuk dilookup
        db.references.toArray(array => state.references = array),
        db.patients.filter(i => ors([ // logicnya berbeda dengan labor
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.radio') &&
            // saring pasien yang radiologinya belum didiagnosa
            j.soapDokter.radio.filter(k => !k.diagnosa).length
          ).length,
          i.rawatInap && i.rawatInap.filter(j =>
            j.observasi && j.observasi.filter(k =>
              k.radio && k.radio.filter(l => !l.diagnosa).length
            ).length
          ).length
        ])).toArray(datas => datas && [
          state.radiologyList = datas.flatMap(i => [
            ...[...(i.rawatJalan || []), ...(i.emergency || [])]
            .flatMap(j =>
              _.get(j, 'soapDokter.radio') &&
              j.soapDokter.radio
              .filter(k => !k.diagnosa)
              .flatMap(k => ({
                // tiap elemen mewakili 1 item request radio
                pasien: i, rawat: j, radio: k
              }))
            ),
            ...((i.rawatInap || []).flatMap(j =>
              j.observasi && j.observasi.flatMap(k =>
                k.radio && k.radio
                .filter(l => !l.diagnosa)
                .flatMap(l => ({
                  pasien: i, inap: j, observasi: k, radio: l
                }))
              )
            ))
          ]).filter(Boolean),
          m.redraw()
        ])
      ]},
      m('thead', m('tr',
        ['Waktu Permintaan', 'No. MR', 'Nama Pasien', 'Instalasi', 'Dokter', 'Grup', 'Item', 'Diproses']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.radiologyList || []).map(i => m('tr',
          // form untuk petugas radiologi merespon request
          {onclick: () => state.modalRadiologi = m('.box',
            m('h3', 'Form Radiologi'),
            m('p', 'Catatan dokter: '+(i.radio.catatan || '-')),
            m(autoForm({
              id: 'responRadiology',
              schema: i.radio.konfirmasi === 1 ?
                // dikonfirmasi dulu, diproses, baru diberikan hasil
                schemas.responRadiology : schemas.confirmRadiology,
              confirmMessage: 'Yakin untuk menyimpan?',
              action: doc => [
                updateBoth(
                  // update info pasien berdasarkan layanan rawatnya
                  'patients', i.pasien._id, _.assign(i.pasien, {
                    rawatJalan: (i.pasien.rawatJalan || []).map(j =>
                      j.idrawat === _.get(i, 'rawat.idrawat') ?
                      _.assign(j, {soapDokter: _.assign(
                        j.soapDokter, {radio:
                          j.soapDokter.radio.map(k =>
                            k.idradio === i.radio.idradio ?
                            _.assign(k, doc) : k
                          )
                        }
                      )}) : j
                    ),
                    emergency: (i.pasien.emergency || []).map(j =>
                      j.idrawat === _.get(i, 'rawat.idrawat') ?
                      _.assign(j, {soapDokter: _.assign(
                        j.soapDokter, {radio:
                          j.soapDokter.radio.map(k =>
                            k.idradio === i.radio.idradio ?
                            _.assign(k, doc) : k
                          )
                        }
                      )}) : j
                    ),
                    rawatInap: (i.pasien.rawatInap || []).map(
                      j => j.idinap === _.get(i, 'inap.idinap') ?
                      _.assign(j, {observasi: j.observasi.map(
                        k => k.idobservasi === i.observasi.idobservasi ?
                        _.assign(k, {radio: k.radio.map(
                          l => l.idradio === i.radio.idradio ?
                          _.assign(l, doc) : l
                        )}) : k
                      )}) : j
                    )
                  })
                ),
                i.radio.diagnosa && // kalau sudah ada diagnosa baru cetak
                  makePdf.radio(i.pasien.identitas, _.merge(i.radio, doc)),
                _.assign(state, {modalRadiologi: null, radiologyList: null}),
                m.redraw()
              ]
            }))
          )},
          // baris tabel yang ditampilkan
          tds([
            hari(ors([
              _.get(i, 'rawat.tanggal'),
              _.get(i, 'observasi.tanggal')
            ]), true),
            _.get(i, 'pasien.identitas.no_mr'),
            _.get(i, 'pasien.identitas.nama_lengkap'),
            ors([
              i.inap && 'Rawat Inap',
              _.get(i, 'rawat.klinik') && look('klinik', i.rawat.klinik),
              'Emergency'
            ]),
            ors([
              i.inap && lookUser(_.get(i, 'observasi.dokter')),
              lookUser(_.get(i, 'rawat.soapDokter.dokter')),
            ]),
            _.startCase(i.radio.grup),
            lookReferences(i.radio.idradio).nama,
            i.radio.konfirmasi === 1 ? hari(i.radio.tanggal, true) : 'Belum'
          ])
        ))
      ),
      makeModal('modalRadiologi')
    )))
  )
})
