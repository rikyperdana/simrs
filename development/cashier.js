/*global _ m comp db state ors ands rupiah look lookReferences updateBoth rupiah makePdf makeModal hari tarifInap tds withThis makeReport lookUser beds moment tarifIGD tarifKartu reports autoForm schemas makeIconLabel*/

// TODO: pikirkan ulang tentang obj kasir dalam rawat

_.assign(comp, {
  cashier: () => state.login.bidang !== 2 ?
  m('p', 'Hanya untuk user bidang kasir') : m('.content',
    state.login.peranan === 4 && reports.cashier(),
    m('h3', 'Loket Pembayaran'),
    m('.box', m('.table-container', m('table.table.is-striped',
      m('thead', m('tr',
        ['No. MR', 'Nama Lengkap', 'Tanggal', 'Layanan', 'Tambahan']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          withThis(
            // cari pasien yang masih berhutang biaya
            j => j.cara_bayar === 1 && ors([
              // yang belum bayar pendaftaran klinik
              j.klinik && !j.bayar_pendaftaran,
              // sudah keluar klinik / igd tapi belum bayar
              j.soapDokter && !j.bayar_konsultasi,
              // sudah keluar inap tapi belum bayar
              ands([j.bed, j.keluar, !j.bayar_konsultasi]),
            ]),
            cashierFilter => db.patients.filter(
              i => [
                ...(i.rawatJalan || []),
                ...(i.emergency || []),
                ...(i.rawatInap || [])
              ].filter(cashierFilter).length
            ).toArray(array => [
              state.cashierList = array.flatMap(
                i => [
                  ...(i.rawatJalan || []),
                  ...(i.emergency || []),
                  ...(i.rawatInap || [])
                ]
                .filter(cashierFilter)
                .map(j => ({pasien: i, rawat: j}))
              ),
              m.redraw()
            ])
          ),
          db.references.toArray(array => state.references = array),
          db.goods.toArray(array => state.goodsList = array)
        ]},
        (state.cashierList || [])
        .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
        .map(
          ({pasien, rawat}) => m('tr',
            {onclick: () => withThis(
              [
                !rawat.bed ? ands([
                  [ // cek apakah ini pasien baru
                    ...(pasien.rawatJalan || []),
                    ...(pasien.emergency || [])
                  ].length === 1, !rawat.bayar_pendaftaran,
                  ['Daftar pasien baru', tarifKartu]
                ]) || [] : [],
                ors([ // tarif layanan rawat (jalan/inap/igd)
                  !rawat.bayar_pendaftaran,
                  !rawat.bayar_konsultasi,
                  rawat.bed && rawat.keluar
                ]) ? ors([
                  rawat.klinik && [
                    'Konsultasi Poli '+look('klinik', rawat.klinik),
                    1000*+look('tarif_klinik', rawat.klinik)
                  ],
                  rawat.bed && [
                    'Biaya Kamar', tarifInap(
                      rawat.tanggal_masuk, rawat.keluar,
                      beds[_.get(rawat.bed, 'kelas')].tarif
                    )
                  ],
                  ['Rawat IGD', tarifIGD]
                ]) || [] : [],
                ...ors([ // tampilkan jika salah 1 kondisi ini terpenuhi
                  ands([rawat.klinik, rawat.soapDokter, !rawat.bayar_konsultasi]), // keluar klinik dan belum bayar
                  ands([rawat.bed, rawat.keluar, !rawat.bayar_konsultasi]), // sudah pulang inap dan belum bayar
                  ands([rawat.soapDokter, !rawat.bayar_konsultasi]) // keluar IGD dan belum bayar
                ]) ? [
                  ...[ // daftar tindakan
                    ...(_.get(rawat, 'soapDokter.tindakan') || []),
                    ...((rawat.observasi || []).flatMap(k => k.tindakan || []))
                  ].map(k => k.idtindakan ? [
                    lookReferences(k.idtindakan).nama,
                    +lookReferences(k.idtindakan).harga
                  ] : []),
                  ...[ // daftar labor
                    ...(_.get(rawat, 'soapDokter.labor') || []),
                    ...((rawat.observasi || []).flatMap(k => k.labor || []))
                  ].map(k => ands([k.idlabor, k.hasil]) ? [
                    lookReferences(k.idlabor).nama,
                    +lookReferences(k.idlabor).harga
                  ] : []),
                  ...[ // daftar radio
                    ...(_.get(rawat, 'soapDokter.radio') || []),
                    ...((rawat.observasi || []).flatMap(k => k.radio || []))
                  ].map(k => ands([k.idradio, k.diagnosa]) ? [
                    lookReferences(k.idradio).nama,
                    +lookReferences(k.idradio).harga
                  ] : []),
                  ...[ // daftar obat
                    ...(_.get(rawat, 'soapDokter.obat') || []),
                    ...((rawat.observasi || []).flatMap(k => k.obat || []))
                  ].map(k => k.idbarang ? [
                    _.get(state.goodsList.find(l => l._id === k.idbarang), 'nama'),
                    k.harga // harga yg sudah dihitungkan logika apotik ke pasien
                  ] : []),
                  ...[ //daftar bhp terpakai saat rawatan
                    ...(_.get(rawat, 'soapDokter.bhp') || []),
                    ...((rawat.observasi || []).flatMap(k => k.bhp || []))
                  ].map(k => k.idbarang ? withThis(
                    state.goodsList.find(l => l._id === k.idbarang),
                    barang => [
                      barang.nama, // carikan harga batch tertinggi di apotik
                      barang.batch.filter(l => l.stok.apotik)
                      .sort((a, b) => b.harga.jual - a.harga.jual)
                      [0].harga.jual
                    ]
                  ) : [])
                ] : []
              ].filter(k => k.length).map(k => ({item: k[0], harga: k[1]})),
              bills => state.modalCashier = m('.box',
                m('h3', 'Konfirmasi Pembayaran'),
                m('p', m('b', [pasien.identitas.nama_lengkap, pasien.identitas.no_mr].join(' / '))),
                m('table.table', withThis(
                  [...bills, ...(rawat.charges || [])],
                  combined => [
                    combined.map(k => m('tr',
                      m('th', k.item), m('td', rupiah(k.harga))
                    )),
                    m('tr', m('th', 'Total'), m('td', rupiah(_.sum(
                      combined.map(k => k.harga)
                    ))))
                  ]
                )),
                m('.buttons',
                  m('.button.is-success',
                    {onclick: () => [
                      confirm('Yakin sudah menerima pembayaran?') &&
                      updateBoth('patients', pasien._id, _.assign(pasien, {
                        // rajal bisa pembayaran awal dan akhir
                        rawatJalan: (pasien.rawatJalan || []).map(
                          k => k.idrawat === rawat.idrawat ?
                          _.assign(k, ors([
                            k.soapDokter && {
                              bayar_konsultasi: true,
                              kasir: state.login._id
                            },
                            {
                              bayar_pendaftaran: true,
                              kasir: state.login._id
                            },
                          ])) : k
                        ),
                        // hanya bayar setelah keluar IGD
                        emergency: (pasien.emergency || []).map(
                          k => k.idrawat === rawat.idrawat ?
                          _.assign(k, {
                            bayar_pendaftaran: true,
                            bayar_konsultasi: true,
                            kasir: state.login._id
                          }) : k
                        ),
                        // hanya bayar setelah pulang inap
                        rawatInap: (pasien.rawatInap || []).map(
                          k => k.idinap === rawat.idinap ?
                          _.assign(k, {
                            bayar_pendaftaran: true,
                            bayar_konsultasi: true,
                            kasir: state.login._id
                          }) : k
                        )
                      })),
                      [
                        ors([rawat.soapDokter, rawat.observasi]) &&
                        makePdf.bayar_konsultasi(
                          pasien, rawat, [...bills, ...(rawat.charges || [])]
                        ),
                        makePdf.bayar_pendaftaran(pasien, rawat, [
                          ...(pasien.rawatJalan || []),
                          ...(pasien.emergency || [])
                        ].length)
                      ],
                      _.assign(state, {modalCashier: null, cashierList: []}),
                      m.redraw()
                    ]},
                    makeIconLabel('check', 'Sudah bayar')
                  ),
                  ors([rawat.soapDokter, rawat.observasi]) && m('.button.is-warning',
                    {onclick: () => _.assign(state, {
                      modalCashier: null, route: 'overcharge',
                      onePatient: pasien, oneRawat: rawat
                    })},
                    makeIconLabel('plus', rawat.charges ? 'Ganti tambahan biaya' : 'Tambahan biaya')
                  )
                )
              )
            )},
            tds([
              pasien.identitas.no_mr,
              pasien.identitas.nama_lengkap,
              hari(rawat.tanggal || rawat.tanggal_masuk),
              ors([
                rawat.klinik && look('klinik', rawat.klinik),
                rawat.bed && 'Rawat Inap',
                'IGD'
              ]),
              rawat.charges ? (rawat.charges.length + ' item') : ''
            ])
          )
        )
      )
    ))),
    makeModal('modalCashier')
  ),

  overcharge: () => m('.content', m(autoForm({
    id: 'overcharge', schema: schemas.overcharge,
    arangement: {'charges.$': [['item', 'harga']]},
    action: doc => updateBoth(
      'patients', state.onePatient._id, _.assign(state.onePatient, {
        rawatJalan: (state.onePatient.rawatJalan || []).map(
          i => i.idrawat === state.oneRawat.idrawat ?
          _.assign(i, doc) : i
        ),
        emergency: (state.onePatient.emergency || []).map(
          i => i.idrawat === state.oneRawat.idrawat ?
          _.assign(i, doc) : i
        ),
        rawatInap: (state.onePatient.rawatInap || []).map(
          i => i.idinap === state.oneRawat.idinap ?
          _.assign(i, doc) : i
        )
      }),
      res => res && [
        _.assign(state, {
          route: 'cashier', cashierList: []
        }), m.redraw()
      ]
    )
  })))
})
