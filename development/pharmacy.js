/*global _ m comp db state ors ands updateBoth hari look makeModal makeReport makePdf lookUser lookGoods withThis moment reports autoForm schemas randomId tds rupiah*/

// TODO: Izinkan apotik lakukan penjualan bebas

_.assign(comp, {
  pharmacy: () => state.login.bidang !== 4 ?
  m('p', 'Hanya untuk user apotik') : m('.content',
    state.login.peranan === 4 && reports.pharmacy(),
    m('h3', 'Apotik'),
    m('table.table',
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Tanggal berobat', 'Cara bayar', 'Layanan']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          db.patients.toArray(array => [
            state.pharmacyList = _.compact(
              array.flatMap(a =>
                ([]).concat(
                  a.rawatJalan ? a.rawatJalan : [],
                  a.emergency ? a.emergency: [],
                  // untuk inap, serahkan obat per kali observasi
                  a.rawatInap ? _.compact(
                    a.rawatInap.flatMap(i =>
                      i.observasi && i.observasi.flatMap(j =>
                        _.assign({}, j, i, {soapDokter: {obat: j.obat}})
                      )
                    )
                  ) : []
                ).flatMap(b => withThis(
                  ands([
                    !_.get(b, 'soapDokter.batal') ? true
                    : !_.includes(b.soapDokter.batal, 'obat'),
                    _.get(b, 'soapDokter.obat')
                  ]),
                  obats => withThis(
                    obats && obats.filter(c => !c.diserah),
                    ungiven => ungiven && ungiven.length !== 0 &&
                    {pasien: a, rawat: b, obats: ungiven.map(
                      // buatkan token untuk pengurangan jumlah
                      c => _.assign(c, {sisa: c.jumlah})
                    )}
                  )
                ))
              )
            ), m.redraw()
          ]),
          db.goods.toArray(array => state.goodsList = array)
        ]},
        (state.pharmacyList || []).map(i => m('tr',
          {ondblclick: () => withThis([], serahList => withThis(
            { // urai jenis obat yang diminta oleh pasien
              updatedGoods: i.obats.flatMap(
                // urai jenis obat yang tersedia di gudang
                a => _.compact(state.goodsList.map(
                  // cari barang yang diminta oleh pasien
                  b => b._id === a.idbarang && _.assign(b, {
                    batch: b.batch.filter(c => ands([
                      // stok masih ada dan belum kadaluarsa
                      c.stok.apotik, c.kadaluarsa > _.now()
                    ])).sort( // urut batch berdasarkan kadaluarsa tercepat
                      (p, q) => p.kadaluarsa - q.kadaluarsa
                    // lakukan pengurangan barang secara berurutan
                    ).reduce((c, d) => withThis(
                      // ambil angka terkecil diantara sisa jumlah permintaan dengan stok apotik batch tersebut
                      _.min([d.stok.apotik, a.sisa]),
                      // selagi minim tidak 0, kurangi stok apotik batch ini
                      minim => minim ? ands([
                        // kurangi sisa permintaan sebanyak minim
                        _.assign(a, {sisa: a.sisa - minim}),
                        // simpan daftar batch berikut dengan jumlah pengurangannya
                        serahList.push(_.merge({}, a, {
                          nama_barang: b.nama, no_batch: d.no_batch,
                          serahkan: minim, jual: minim * d.harga.jual
                        })),
                        [...c, _.assign(d, {stok: _.assign(
                          // kurangi stok diapotik sebanyak minim
                          d.stok, {apotik: d.stok.apotik - minim}
                        )})]
                      // jika minim 0 maka lewatkan (bisa jadi habis, belum amprah, atau sudah retur)
                      ]) : [...c, d]
                    ), [])
                  })
                ))
              ),
              updatedPatient: _.assign(i.pasien, {
                rawatJalan: (i.pasien.rawatJalan || []).map(
                  a => a.idrawat === i.rawat.idrawat ?
                   _.assign(a, {soapDokter: _.assign(a.soapDokter,
                    {obat: (a.soapDokter.obat || []).map(
                      b => _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(
                          c => c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    )}
                  )}) : a
                ),
                emergency: (i.pasien.emergency || []).map(
                  a => a.idrawat === i.rawat.idrawat ?
                   _.assign(a, {soapDokter: _.assign(a.soapDokter,
                    {obat: (a.soapDokter.obat || []).map(
                      b => _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(
                          c => c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    )}
                  )}) : a
                ),
                // TODO URGENT: buatkan juga untuk rawatInap
                rawatInap: (i.pasien.rawatInap || []).map(
                  a => a.idinap === i.rawat.idinap ?
                  _.assign(a, {observasi: a.observasi.map(
                    b => b.idobservasi === i.rawat.idobservasi ?
                    _.assign(b, {obat: b.obat.map(
                      c => _.assign(c, {diserah: true, harga: _.sum(
                        serahList.filter(
                          d => d.idbarang === c.idbarang
                        ).map(d => d.jual)
                      )})
                    )}) : b
                  )}) : a
                )
              })
            },
            ({updatedGoods, updatedPatient}) =>
              state.modalSerahObat = m('.box',
                m('h4', 'Penyerahan obat'),
                m('table.table',
                  m('thead', m('tr',
                    ['Nama obat', 'No. Batch', 'Merek', 'Ambil', 'Kali', 'Dosis', 'Puyer']
                    .map(j => m('th', j))
                  )),
                  m('tbody', serahList.map(j => m('tr',
                    [
                      j.nama_barang, j.no_batch, j.merek, j.serahkan,
                      j.aturan && j.aturan.kali || '-',
                      j.aturan && j.aturan.dosis || '-',
                      j.puyer || '-'
                    ].map(k => m('td', k))
                  )))
                ),
                m('p.buttons',
                  m('.button.is-info',
                    {onclick: () => makePdf.resep(
                      updatedPatient.identitas, serahList
                    )},
                    m('span.icon', m('i.fas.fa-print')),
                    m('span', 'Cetak salinan resep')
                  ),
                  m('.button.is-primary',
                    {ondblclick: () => [
                      updateBoth('patients', updatedPatient._id, updatedPatient),
                      updatedGoods.map(j => updateBoth('goods', j._id, j)),
                      state.modalSerahObat = null, m.redraw()
                    ]},
                    m('span.icon', m('i.fas.fa-check')),
                    m('span', 'Selesai')
                  ),
                  m('.button.is-danger',
                    {ondblclick: () => updateBoth(
                      'patients', i.pasien._id, _.assign(i.pasien, {
                        rawatJalan: (i.pasien.rawatJalan || []).map(
                          j => j.idrawat === i.rawat.idrawat ?
                          _.assign(j, {soapDokter: _.merge(
                            j.soapDokter, {batal: ['obat']}
                          )}) : j
                        ),
                        emergency: (i.pasien.emergency || []).map(
                          j => j.idrawat === i.rawat.idrawat ?
                          _.assign(j, {soapDokter: _.merge(
                            j.soapDokter, {batal: ['obat']}
                          )}) : j
                        ),
                        rawatInap: (i.pasien.rawatInap || []).map(
                          j => j.idinap === i.rawat.idinap ?
                          // pembatalannya level observasi
                          _.assign(j, {observasi: j.observasi.map(
                            k => k.idobservasi === i.rawat.idobservasi ?
                            _.merge(k, {batal: ['obat']}) : k
                          )}) : j
                        )
                      }, res => res && [state.modalSerahObat = null, m.redraw()])
                    )},
                    m('span.icon', m('i.fas.fa-times')),
                    m('span', 'Batal serah')
                  )
                )
              )
          ))},
          [
            i.pasien.identitas.no_mr, i.pasien.identitas.nama_lengkap,
            hari(i.rawat.tanggal, true), look('cara_bayar', i.rawat.cara_bayar),
            ors([
              i.rawat.klinik && look('klinik', i.rawat.klinik),
              i.rawat.bed && 'Rawat Inap',
              'IGD'
            ])
          ].map(j => m('td', j))
        )),
        makeModal('modalSerahObat')
      )
    ),
    localStorage.openBeta &&
    m('.button.is-primary',
      {
        'data-tooltip': 'Untuk menjual obat secara manual',
        ondblclick: () => [_.assign(state, {route: 'pharmacySale'}), m.redraw()]
      },
      m('span.icon', m('i.fas.fa-cart-arrow-down')),
      m('span', 'Penjualan Bebas')
    )
  ),
  pharmacySale: () => m('.content',
    m('h3', 'Penjualan Bebas Obat & BHP'),
    m(autoForm({
      id: 'pharmacySale',
      oncreate: () =>
        db.goods.toArray(array => _.assign(state, {
          goodsList: array,
          drugList: array.filter(i => ands([
            i.jenis === 1,
            i.batch.filter(j => ands([
              j.stok.apotik > i.stok_minimum.apotik,
              j.kadaluarsa > _.now()
            ])).length
          ])),
          bhpList: array.filter(i => i.jenis === 2),
        })),
      schema:
        _.merge(
          {idpenjualan: {
            type: String,
            autoform: {type: 'hidden'},
            autoValue: () => randomId()
          }},
          _.map(schemas.soapDokter, (v, k) => ors([
            _.includes(k, 'obat'), _.includes(k, 'bhp')
          ]) && {[k]: v}).filter(Boolean)
          .reduce((res, inc) => _.merge(res, inc), {})
        ),
      action: doc =>
        withThis(
          {serahList: [], updatedGoods: []},
          ({serahList, updatedGoods}) => 
          [
            updatedGoods.push((doc.obat || [])
            .flatMap(i => state.goodsList.flatMap(
              j => j._id === i.idbarang &&
              _.assign(j, {batch: j.batch
                .filter(k => ands([
                  k.stok.apotik,
                  k.kadaluarsa > _.now()
                ]))
                .sort((a, b) => a.kadaluarsa - b.kadaluarsa)
                .reduce((res, inc) => [
                  ...res, i.jumlah ? withThis(
                    _.min([inc.stok.apotik, i.jumlah]),
                    minim => minim ? ands([
                      serahList.push({
                        nama: j.nama, no_batch: inc.no_batch,
                        jumlah: minim, harga: inc.harga.jual * minim
                      }),
                      _.assign(i, {jumlah: i.jumlah - minim}),
                      _.assign(inc, {
                        stok: _.assign(inc.stok, {
                          apotik: inc.stok.apotik - minim
                        }),
                        penjualan: [...(inc.penjualan || []), {
                          idpenjualan: doc.idpenjualan,
                          jumlah: minim, tanggal: _.now()
                        }]
                      })
                    ]) : inc
                  ) : inc
                ], []
              )})
            ).filter(Boolean))),
            state.modalPenjualanBebas = m('.box',
              m('h3', 'Konfirmasi Penjualan'),
              m('table.table',
                m('thead', m('tr', ['Nama Obat', 'No. Batch', 'Jumlah', 'Harga'].map(i => m('th', i)))),
                m('tbody', [...serahList].map(i => m('tr', tds([
                  i.nama, i.no_batch, i.jumlah+' unit', rupiah(i.harga)
                ])))),
                m('tr', tds([m('b', 'Total'), '', '', rupiah(_.sum(serahList.map(i => i.harga)))]))
              ),
              m('.buttons',
                /*
                  pasien datang pesan obat ke apotik, apoteker isi form obat & cetak resep,
                  pasien bayar ke kasir, pasien tunjukkan bukti bayar ke apotik
                  apoteker isi/ubah form obat, selesaikan mutasi barang
                */
                m('.button.is-info',
                  {onclick: () => ''},
                  m('span.icon', m('i.fas.fa-print')),
                  m('span', 'Cetak salinan resep')
                ),
                m('.button.is-primary',
                  {ondblclick: () => console.log(updatedGoods[0])},
                  m('span.icon', m('i.fas.fa-check')),
                  m('span', 'Serahkan')
                )
              )
            )
          ]
        )
    })),
    makeModal('modalPenjualanBebas')
  )
})