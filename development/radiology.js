/*global m _ comp db state tds lookUser look makeModal autoForm schemas moment lookReferences hari ors makePdf updateBoth*/

/*
  TODOS:
  - integrasi soapView soapPdf (ok)
  - integrasi cashier
  - intermediat konfirmasi (ok)
*/
_.assign(comp, {
  // Note: Selagi masih beta radiologi tidak integrated dengan kasir dan pdf
  radiology: () => m('.content',
    m('h1', 'Radiologi'),
    // tabel untuk melihat daftar request radiologi yang direquest dokter
    m('table.table',
      {onupdate: () => [
        // siapkan daftar referensi untuk dilookup
        db.references.toArray(array => state.references = array),
        db.patients.filter(i => ors([
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.radio') &&
            // saring pasien yang radiologinya belum didiagnosa
            j.soapDokter.radio.filter(k => !k.diagnosa).length
          ).length,
          i.rawatInap && i.rawatInap.filter(j =>
            j.observasi && j.observasi.filter(k =>
              _.get(k, 'soapDokter.radio') &&
              // saring observasi yang request radiologinya belum didiagnosa
              k.soapDokter.radio.filter(l => !l.diagnosa).length
            ).length
          ).length
        ])).toArray(datas => [
          state.radiologyList = datas.flatMap(i => [
            ...[...(i.rawatJalan || []), ...(i.emergency || [])].flatMap(j =>
              j.soapDokter && j.soapDokter.radio &&
              j.soapDokter.radio.map(k => ({
                // tiap elemen mewakili 1 item request radio
                pasien: i, rawat: j, radio: k
              }))
            ),
            ...((i.rawatInap || []).flatMap(j =>
              j.observasi && j.observasi.map(k =>
                _.get(k, 'soapDokter.radio') &&
                k.soapDokter.radio.map(l => ({
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
        state.radiologyList &&
        state.radiologyList.map(i => m('tr',
          // form untuk petugas radiologi merespon request
          {ondblclick: () => state.modalRadiologi = m('.box',
            m('h3', 'Form Radiologi'),
            i.radio.konfirmasi === 1 &&
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
                      j.idrawat === i.rawat.idrawat ?
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
                      j.idrawat === i.rawat.idrawat ?
                      _.assign(j, {soapDokter: _.assign(
                        j.soapDokter, {radio:
                          j.soapDokter.radio.map(k =>
                            k.idradio === i.radio.idradio ?
                            _.assign(k, doc) : k
                          )
                        }
                      )}) : j
                    ),
                    // TODO: update yg dari rawatInap
                    rawatInap: (i.pasien.rawatInap || []).map(
                      j => j.idinap === i.inap.idinap ?
                      _.assign(j, {observasi: j.observasi.map(
                        k => k.idobservasi === i.observasi.idobservasi ?
                        _.assign(k, {radio: k.radio.map(
                          l => l.radio === i.radio.idradio ?
                          _.assign(l, doc) : l
                        )}) : k
                      )}) : j
                    )
                  })
                ),
                i.radio.diagnosa && // kalau sudah ada diagnosa baru cetak
                  makePdf.radio(i.pasien.identitas, _.merge(i.radio, doc)),
                state.modalRadiologi = null, m.redraw()
              ]
            }))
          )},
          // baris tabel yang ditampilkan
          tds([
            hari(i.rawat.tanggal, true),
            i.pasien.identitas.no_mr,
            i.pasien.identitas.nama_lengkap,
            ors([
              i.inap && 'Rawat Inap',
              i.rawat.klinik && look('klinik', i.rawat.klinik),
              'Emergency'
            ]),
            ors([
              i.inap && lookUser(_.get(i, 'observasi.soapDokter.dokter')),
              lookUser(_.get(i, 'rawat.soapDokter.dokter')),  
            ]),
            _.startCase(i.radio.grup),
            lookReferences(i.radio.idradio).nama,
            i.radio.konfirmasi === 1 && hari(i.radio.tanggal, true)
          ])
        ))
      ),
      makeModal('modalRadiologi')
    )
  )
})