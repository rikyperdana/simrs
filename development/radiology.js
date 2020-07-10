/*global m _ comp db state tds lookUser look makeModal autoForm schemas moment lookReferences hari ors makePdf*/

/*
  TODOS: Integrasi
  - soapView soapPdf (ok)
  - cashier
*/
_.assign(comp, {
  // Note: Selagi masih beta radiologi tidak integrated dengan kasir dan pdf
  radiology: () => m('.content',
    m('h1', 'Radiologi'),
    // tabel untuk melihat daftar request radiologi yang direquest dokter
    m('table.table',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.patients.filter(i => ors([
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.radio') &&
            j.soapDokter.radio.filter(k => !k.diagnosa).length
          ).length,
          i.rawatInap && i.rawatInap.filter(j =>
            j.observasi && j.observasi.filter(k =>
              _.get(k, 'soapDokter.radio') &&
              k.soapDokter.radio.filter(l => l).length
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
          ]),
          m.redraw()
        ])
      ]},
      m('thead', m('tr',
        ['Waktu Permintaan', 'No. MR', 'Nama Pasien', 'Instalasi', 'Dokter', 'Grup', 'Item']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.radiologyList &&
        state.radiologyList.map(i => m('tr',
          // form untuk petugas radiologi mengisikan informasi hasil radiologi
          {ondblclick: () => state.radiologyForm = m('.box',
            m('h3', 'Form Radiologi'),
            m('p', 'Catatan dokter: '+(i.radio.catatan || '-')),
            m(autoForm({
              id: 'responRadiology', schema: schemas.responRadiology,
              action: doc => confirm('Yakin untuk menyimpan?') && [
                console.log(
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
                    )
                  })
                ),
                makePdf.radio(i.pasien.identitas, _.merge(i.radio, doc)),
                state.radiologyForm = null, m.redraw()
              ]
            }))
          )},
          tds([
            hari(i.rawat.tanggal, true),
            i.pasien.identitas.no_mr,
            i.pasien.identitas.nama_lengkap,
            ors([
              i.inap && 'Rawat Inap',
              look('klinik', i.rawat.klinik),
              'Emergency'
            ]),
            ors([
              i.inap && lookUser(i.observasi.soapDokter.dokter),
              lookUser(i.rawat.soapDokter.dokter),  
            ]),
            _.startCase(i.radio.grup),
            lookReferences(i.radio.idradio).nama
          ])
        ))
      ),
      makeModal('radiologyForm')
    )
  )
})