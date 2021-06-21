/*global _ m comp db state ors ands updateBoth hari look makeModal makeReport makePdf lookUser withThis reports autoForm schemas randomId tds rupiah makeIconLabel layouts*/

_.assign(comp, {
  pharmacy: () => state.login.bidang !== 4 ?
  m('p', 'Hanya untuk user apotik') : m('.content',
    state.login.peranan === 4 && [
      reports.pharmacy(),
      reports.sales()
    ],
    m('h3', 'Apotik'),
    state.loading && m('progress.progress.is-small.is-primary'),
    m('.box', m('.table-container', m('table.table.is-striped',
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Tanggal berobat', 'Cara bayar', 'Layanan']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          state.loading = true,
          db.patients.toArray(array => [
            state.pharmacyList = _.compact(
              array.flatMap(a =>
                [
                  ...(a.rawatJalan || []),
                  ...(a.emergency || []),
                  // untuk inap, serahkan obat per kali observasi
                  ...(a.rawatInap ? _.compact(a.rawatInap.flatMap(i =>
                    i.observasi && i.observasi.flatMap(j =>
                      _.assign({}, j, i, {soapDokter: {obat: j.obat}})
                    )
                  )) : [])
                ].flatMap(b => withThis(
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
            ),
            state.loading = false, m.redraw()
          ]),
          db.goods.toArray(array => state.goodsList = array)
        ]},
        (state.pharmacyList || []).map(i => m('tr',
          {onclick: () => withThis([], serahList => withThis(
            { // urai jenis obat yang diminta oleh pasien
              updatedGoods: i.obats.flatMap(
                // urai jenis obat yang tersedia di gudang
                a => _.compact(state.goodsList.map(
                  // cari barang yang diminta oleh pasien
                  b => b._id === a.idbarang ? _.assign(b, {
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
                          nama_barang: b.nama, no_batch: d.no_batch, merek: d.merek,
                          serahkan: minim, jual: minim * d.harga.jual, kode_rak: b.kode_rak
                        })),
                        [...c, _.assign(d, {stok: _.assign(
                          // kurangi stok diapotik sebanyak minim
                          d.stok, {apotik: d.stok.apotik - minim}
                        )})]
                      // jika minim 0 maka lewatkan (bisa jadi habis, belum amprah, atau sudah karantina)
                      ]) : [...c, d]
                    ), [])
                  }) : null // hanya update obat yang stoknya berubah
                ))
              ),
              updatedPatient: _.assign(i.pasien, {
                rawatJalan: (i.pasien.rawatJalan || []).map(
                  a => a.idrawat === i.rawat.idrawat ?
                   _.assign(a, {soapDokter: _.assign(a.soapDokter, {
                    obat: (a.soapDokter.obat || []).map(
                      b => _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(
                          c => c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    ),
                    apoteker: state.login._id
                  })}) : a
                ),
                emergency: (i.pasien.emergency || []).map(
                  a => a.idrawat === i.rawat.idrawat ?
                   _.assign(a, {soapDokter: _.assign(a.soapDokter,{
                    obat: (a.soapDokter.obat || []).map(
                      b => _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(
                          c => c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    ),
                    apoteker: state.login._id
                  })}) : a
                ),
                rawatInap: (i.pasien.rawatInap || []).map(
                  a => a.idinap === i.rawat.idinap ?
                  _.assign(a, {observasi: a.observasi.map(
                    b => b.idobservasi === i.rawat.idobservasi ?
                    _.assign(b, {
                      obat: b.obat.map(
                        c => _.assign(c, {diserah: true, harga: _.sum(
                          serahList.filter(
                            d => d.idbarang === c.idbarang
                          ).map(d => d.jual)
                        )})
                      ),
                      apoteker: state.login._id
                    }) : b
                  )}) : a
                )
              })
            },
            ({updatedGoods, updatedPatient}) =>
              state.modalSerahObat = m('.box',
                m('h4', 'Penyerahan obat'),
                m('.table-container', m('table.table',
                  m('thead', m('tr',
                    ['Nama obat', 'No. Batch', 'Merek', 'Ambil', 'Aturan Pakai', 'Puyer', 'Kode Rak']
                    .map(j => m('th', j))
                  )),
                  m('tbody', serahList.map(j => m('tr',
                    [
                      j.nama_barang, j.no_batch, j.merek, j.serahkan,
                      j.aturan || '', j.puyer || '-', j.kode_rak
                    ].map(k => m('td', k))
                  )))
                )),
                m('p.buttons',
                  m('.button.is-info',
                    {onclick: () => makePdf.resep(
                      serahList, updatedPatient.identitas
                    )},
                    makeIconLabel('print', 'Cetak salinan resep')
                  ),
                  m('.button.is-primary',
                    {onclick: () => confirm(
                      'Yakin sudah menyerahkan barang?'
                    ) && [
                      updateBoth('patients', updatedPatient._id, updatedPatient),
                      updatedGoods.map(j => updateBoth('goods', j._id, j)),
                      _.assign(state, {modalSerahObat: null, pharmacyList: []}),
                      m.redraw()
                    ]},
                    makeIconLabel('check', 'Selesai')
                  ),
                  m('.button.is-danger',
                    {onclick: () => confirm('Yakin membatalkan penyerahan?') && updateBoth(
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
                      }), res => res && [
                        state.modalSerahObat = null, m.redraw()
                      ]
                    )},
                    makeIconLabel('times', 'Batal serah')
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
    ))),
    m('.button.is-primary',
      {
        'data-tooltip': 'Untuk menjual obat secara manual',
        onclick: () => [_.assign(state, {route: 'pharmacySale'}), m.redraw()]
      },
      makeIconLabel('cart-arrow-down', 'Penjualan Bebas')
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
            (i.batch || []).filter(j => ands([
              j.stok.apotik > i.stok_minimum.apotik,
              j.kadaluarsa > _.now()
            ])).length
          ])),
          bhpList: array.filter(i => i.jenis === 2),
        })),
      schema: _.merge(
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
      layout: layouts.sales,
      action: doc => withThis(
        {serahList: [], updatedGoods: []},
        ({serahList, updatedGoods}) => [
          updatedGoods.push(
            [...(doc.obat || []), ...(doc.bhp || [])]
            .flatMap(i => state.goodsList.flatMap(
              j => j._id === i.idbarang ? _.assign(j, {
                batch: j.batch.filter(k => ands([
                  k.stok.apotik, k.kadaluarsa > _.now()
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
                          jumlah: minim, tanggal: _.now(),
                          user: state.login._id
                        }]
                      })
                    ]) : inc
                  ) : inc
                ], [])
              }) : j
            ).filter(Boolean))
          ),
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
                pasien bayar ke kasir atau langsung di apotik,
                pasien tunjukkan bukti bayar ke apotik,
                apoteker isi/ubah form obat,
                jalankan mutasi barang.
                TODO: sesuaikan keys serahList ini dengan serahList apotik
              */
              m('.button.is-info',
                {onclick: () => makePdf.resep(serahList.map(i => _.assign(i, {
                  nama_barang: i.nama, serahkan: i.jumlah
                })), 'bebas')},
                makeIconLabel('print', 'Cetak salinan resep')
              ),
              m('.button.is-primary',
                {onclick: () => confirm('Yakin sudah menyerahkan?') && [
                  updatedGoods[0].map(
                    i => updateBoth('goods', i._id, i)
                  ),
                  _.assign(state, {
                    modalPenjualanBebas: null,
                    route: 'pharmacy'
                  }),
                  m.redraw()
                ]},
                makeIconLabel('check', 'Serahkan')
              )
            )
          )
        ]
      )
    })),
    makeModal('modalPenjualanBebas')
  )
})
