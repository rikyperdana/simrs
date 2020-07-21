/*global _ m comp db state ors ands updateBoth hari look makeModal makeReport makePdf lookUser lookGoods withThis moment reports*/

// TODO: Gimana kalau dengan BHP ya? Karena dia dipakai dulu baru ditagih

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
                  _.get(b, 'soapDokter.obat'),
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
          db.goods.toArray(array =>
            state.goodsList = array
          )
        ]},
        (state.pharmacyList || []).map(i => m('tr',
          {ondblclick: () => withThis([], serahList => withThis(
            { // urai jenis obat yang diminta oleh pasien
              updatedGoods: i.obats.flatMap(
                // urai jenis obat yang tersedia di gudang
                a => _.compact(state.goodsList.map(
                  // cari barang yang diminta oleh pasien
                  b => b._id === a.idbarang && _.assign(b, {
                    // urut batch berdasarkan kadaluarsa tercepat
                    batch: b.batch.sort(
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
                        c.concat([_.assign(d, {stok: _.assign(
                          // kurangi stok diapotik sebanyak minim
                          d.stok, {apotik: d.stok.apotik - minim}
                        )})])
                      // jika minim 0 maka lewatkan (bisa jadi habis, belum amprah, atau sudah retur)
                      ]) : c.concat([d])
                    ), [])
                  })
                ))
              ),
              updatedPatient: _.assign(i.pasien, {
                rawatJalan: (i.pasien.rawatJalan || []).map(
                  a => ands([
                    a.idrawat === i.rawat.idrawat
                  ]) ? _.assign(a, {soapDokter: _.assign(a.soapDokter,
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
                  a => ands([
                    a.idrawat === i.rawat.idrawat
                  ]) ? _.assign(a, {soapDokter: _.assign(a.soapDokter,
                    {obat: (a.soapDokter.obat || []).map(
                      b => _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(
                          c => c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    )}
                  )}) : a
                )
                // TODO: buatkan juga untuk rawatInap
              })
            },
            ({updatedGoods, updatedPatient}) =>
              state.modalSerahObat = m('.box',
                m('h4', 'Penyerahan obat'),
                m('table.table',
                  m('thead', m('tr',
                    ['Nama obat', 'No. Batch', 'Ambil', 'Kali', 'Dosis', 'Puyer']
                    .map(j => m('th', j))
                  )),
                  m('tbody', serahList.map(j => m('tr',
                    [
                      j.nama_barang, j.no_batch, j.serahkan,
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
                      console.log('patients', updatedPatient._id, updatedPatient),
                      updatedGoods.map(j => console.log('goods', j._id, j)),
                      state.modalSerahObat = null, m.redraw()
                    ]},
                    m('span.icon', m('i.fas.fa-check')),
                    m('span', 'Selesai')
                  )
                )
              )
          ))},
          [
            i.pasien.identitas.no_mr, i.pasien.identitas.nama_lengkap,
            hari(i.rawat.tanggal), look('cara_bayar', i.rawat.cara_bayar),
            ors([
              i.rawat.klinik && look('klinik', i.rawat.klinik),
              i.rawat.kode_bed && 'Rawat Inap',
              'IGD'
            ])
          ].map(j => m('td', j))
        )),
        makeModal('modalSerahObat')
      )
    )
  )
})