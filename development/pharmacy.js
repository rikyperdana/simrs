/*global _ m comp db state ors ands updateBoth hari look makeModal makeReport makePdf lookUser lookGoods withThis moment*/

_.assign(comp, {
  pharmacy: () => state.login.bidang !== 4 ?
  m('p', 'Hanya untuk user apotik') : m('.content',
    state.login.peranan === 4 &&
    makeReport('Pengeluaran Apotik', e => withThis(
      {
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      },
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Laporan Pengeluaran Obat',
          [['Tanggal', 'No. MR', 'Nama Pasien', 'Layanan', 'Dokter', 'Nama Obat', 'Jumlah']]
          .concat(array.flatMap(pasien =>
            _.compact(([]).concat(
              pasien.rawatJalan || [],
              pasien.emergency || [],
              (pasien.rawatInap || []).flatMap(i =>
                i.observasi && i.observasi
                .filter(j => j.soapDokter)
              )
            ).flatMap(rawat =>
              _.get(rawat, 'soapDokter.obat') &&
              rawat.soapDokter.obat.map(i => [
                hari(rawat.tanggal),
                pasien.identitas.no_mr,
                pasien.identitas.nama_lengkap,
                ors([
                  rawat.klinik && look('klinik', rawat.klinik),
                  rawat.idinap && 'Rawat Inap',
                  'Gawat Darurat'
                ]),
                lookUser(rawat.soapDokter.dokter),
                lookGoods(i.idbarang).nama,
                i.jumlah
              ])
            ))
          ))
        ))
      ]
    )),
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
                      _.merge({}, a, b, {obats: ungiven})
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
              updatedGoods: _.compact(i.obats.flatMap(a =>
                // urai jenis obat yang tersedia di gudang
                state.goodsList.flatMap(b =>
                  // cari barang yang diminta oleh pasien
                  b._id === a.idbarang && _.assign(b, {batch:
                    // urut batch berdasarkan kadaluarsa tercepat
                    b.batch.sort((p, q) =>
                      p.kadaluarsa - q.kadaluarsa
                    // lakukan pengurangan barang secara berurutan
                    ).reduce((c, d) => withThis(
                      // ambil angka terkecil diantara sisa jumlah permintaan dengan stok apotik batch tersebut
                      _.min([d.stok.apotik, a.jumlah]), minim =>
                        // selagi minim tidak 0, kurangi stok apotik batch ini
                        minim ? ands([
                          // kurangi jumlah permintaan sebanyak minim
                          _.forEach(_.range(minim), () => a.jumlah--),
                          // simpan daftar batch berikut dengan jumlah pengurangannya
                          serahList.push(_.merge({}, a, {
                            nama_barang: b.nama, no_batch: d.no_batch,
                            serahkan: minim, jual: minim * d.harga.jual,
                          })),
                          c.concat([_.assign(d, {stok: _.assign(d.stok, {
                            // kurangi stok diapotik sebanyak minim
                            apotik: d.stok.apotik - minim
                          })})])
                        // jika minim 0 maka lewatkan (bisa jadi habis, belum amprah, atau sudah retur)
                        ]) : c.concat([d])
                    ), [])
                  })
                )
              )),
              updatedPatient: {
                identitas: i.identitas, _id: i._id,
                rawatJalan: (i.rawatJalan || []).map(a =>
                  ands([a.idrawat === i.idrawat, i.klinik]) ?
                  _.assign(a, {soapDokter: _.assign(a.soapDokter, {obat:
                    (a.soapDokter.obat || []).map(b =>
                      _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(c =>
                          c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    )
                  })}) : a
                ),
                emergency: (i.emergency || []).map(a =>
                  ands([a.idrawat === i.idrawat, !i.klinik, !i.idinap]) ?
                  _.assign(a, {soapDokter: _.assign(a.soapDokter, {obat:
                    a.soapDokter.obat.map(b =>
                      _.assign(b, {diserah: true, harga: _.sum(
                        serahList.filter(c =>
                          c.idbarang === b.idbarang
                        ).map(c => c.jual)
                      )})
                    )
                  })}) : a
                ),
                rawatInap: (i.rawatInap || []).map(a =>
                  a.idinap === i.idinap ?
                  _.assign(a, {observasi: a.observasi.map(b =>
                    b.idobservasi === i.idobservasi ?
                    _.assign(b, {obat: b.obat.map(c =>
                      _.assign(c, {diserah: true, harga: _.sum(
                        serahList.filter(d =>
                          d.idbarang === c.idbarang
                        ).map(d => d.jual)
                      )})
                    )}) : b
                  )}) : a
                )
              }
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
                    {onlick: () => [
                      updateBoth('patients', updatedPatient._id, updatedPatient),
                      updatedGoods.map(j => updateBoth('goods', j._id, j)),
                      state.modalSerahObat = null, m.redraw()
                    ]},
                    m('span.icon', m('i.fas.fa-check')),
                    m('span', 'Selesai')
                  )
                )
              )
          ))},
          [
            i.identitas.no_mr, i.identitas.nama_lengkap,
            hari(i.tanggal), look('cara_bayar', i.cara_bayar),
            ors([
              i.klinik && look('klinik', i.klinik),
              i.kode_bed && 'Rawat Inap',
              'IGD'
            ])
          ].map(j => m('td', j))
        )),
        makeModal('modalSerahObat')
      )
    )
  )
})