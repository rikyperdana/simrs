/*global m _ comp state tds db hari ors look lookUser makeModal lookReferences withThis updateBoth*/

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
        ['Waktu Permintaan', 'No. MR', 'Nama Pasien', 'Instalasi', 'Dokter']
        .map(i => m('th', i))
      )),
      // berbeda dengan radiologi, 1 baris mewakili 1 kali rawat
      m('tbody',
        (state.laboratoryList || []).map(i => m('tr',
          {ondblclick: () => state.modalLaboratory = m('.box',
            m('h3', 'Respon Laboratorium'),
            m('table.table',
              // m('tr', m('th', 'Jenis cek'), m('th', 'Nilai isian')),
              m('tr', ['Jenis cek', 'Nilai isian', 'Input'].map(j => m('th', j))),
              i.rawat.soapDokter.labor.map(
                j => m('tr', tds([
                  // mungkin tidak butuh intermediat konfirmasi seperti radiologi
                  lookReferences(j.idlabor).nama, j.hasil,
                  m('.button.is-link', {onclick: e => [
                    e.stopPropagation, withThis(
                      // setiap baris di dalam tabel modal mewakili 1 item labor, diisi secara terpisah
                      prompt('Nilai hasil cek?'),
                      hasil => updateBoth(
                        'patients', i.pasien._id, _.assign(i.pasien, {
                          rawatJalan: (i.pasien.rawatJalan || []).map(
                            k => k.idrawat === i.rawat.idrawat ? _.assign(k, {
                              soapDokter: _.assign(i.rawat.soapDokter, {
                                labor: i.rawat.soapDokter.labor.map(
                                  l => l.idlabor === j.idlabor ?
                                  _.assign(l, {hasil}) : l
                                )
                              })
                            }) : k
                          ),
                          emergency: (i.pasien.emergency || []).map(
                            k => k.idrawat === i.rawat.idrawat ? _.assign(k, {
                              soapDokter: _.assign(i.rawat.soapDokter, {
                                labor: i.rawat.soapDokter.labor.map(
                                  l => l.idlabor === j.idlabor ?
                                  _.assign(l, {hasil}) : l
                                )
                              })
                            }) : k
                          ), // TODO: jangan lupa untuk rawatInap
                        })
                      ) && _.assign(state, {
                        // BUG: ini hanya solusi sementara, upayakan auto update
                        laboratoryList: null, modalLaboratory: null
                      })
                    )
                  ]}, 'isi')
                ]))
              )
             )
          )},
          tds([
            hari(i.rawat.tanggal),
            i.pasien.identitas.no_mr,
            i.pasien.identitas.nama_lengkap,
            ors([
              i.rawat.klinik && look('klinik', i.rawat.klinik),
              i.observasi && 'Rawat Inap',
              'Emergency'
            ]),
            lookUser(i.rawat.soapDokter.dokter)
          ])
        ))
      ),
      makeModal('modalLaboratory')
    )
  )
})