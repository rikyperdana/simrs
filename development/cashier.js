/*global _ m comp db state ors ands rupiah look lookReferences updateBoth rupiah makePdf makeModal hari tarifInap tds withThis makeReport lookUser beds moment tarifIGD tarifKartu reports autoForm schemas makeIconLabel*/

// TODO: pikirkan ulang tentang obj kasir dalam rawat

_.assign(comp, {
  cashier: () => state.login.bidang !== 2 ?
  m('p', 'Hanya untuk user bidang kasir') : m('.content',
    state.login.peranan === 4 && reports.cashier(),
    m('h3', 'Loket Pembayaran'),
    m('table.table',
      m('thead', m('tr',
        ['No. MR', 'Nama Lengkap', 'Tanggal', 'Layanan', 'Tambahan']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          db.patients.filter(i =>
            ([]).concat(
              i.rawatJalan ? i.rawatJalan : [],
              i.emergency ? i.emergency: [],
              i.rawatInap ? i.rawatInap: []
            ).filter(j =>
              // cari pasien yang masih berhutang biaya
              j.cara_bayar === 1 && ors([
                // yang belum bayar pendaftaran klinik
                j.klinik && !j.bayar_pendaftaran,
                // sudah keluar klinik / igd tapi belum bayar
                j.soapDokter && !j.bayar_konsultasi,
                // sudah keluar inap tapi belum bayar
                ands([j.bed, j.keluar, !j.bayar_konsultasi]),
              ])
            ).length
          ).toArray(array => state.cashierList = array),
          db.references.toArray(array => state.references = array),
          db.goods.toArray(array => state.goodsList = array)
        ]},
        state.cashierList &&
        state.cashierList.map(i =>
          ([]).concat(
            i.rawatJalan ? i.rawatJalan : [],
            i.emergency ? i.emergency: [],
            i.rawatInap ? i.rawatInap : []
          ).map(j => ors([
            j.cara_bayar === 1 && ors([
              // samakan dengan logika filter diatas
              j.klinik && !j.bayar_pendaftaran,
              j.soapDokter && !j.bayar_konsultasi,
              ands([j.bed, j.keluar, !j.bayar_konsultasi])
            ]),
          ]) && m('tr',
            {ondblclick: () => withThis(
              [
                !j.bed ? ands([
                  [ // cek apakah ini pasien baru
                    ...(i.rawatJalan || []),
                    ...(i.emergency || []),
                    ...(i.rawatInap || []),
                  ].length === 1, !j.bayar_pendaftaran,
                  ['Daftar pasien baru', tarifKartu]
                ]) || [] : [],
                ors([ // tarif layanan rawat (jalan/inap/igd)
                  !j.bayar_pendaftaran,
                  !j.bayar_konsultasi,
                  j.bed && j.keluar
                ]) ? ors([
                  j.klinik && [
                    'Konsultasi Poli '+look('klinik', j.klinik),
                    1000*+look('tarif_klinik', j.klinik)
                  ],
                  j.bed && [
                    'Biaya Kamar', tarifInap(
                      j.tanggal_masuk, j.keluar,
                      beds[_.get(j.bed, 'kelas')].tarif
                    )
                  ],
                  ['Rawat IGD', tarifIGD]
                ]) || [] : [],
                ...ors([
                  j.klinik && !j.bayar_konsultasi, // daftar berobat ke klinik
                  j.bed && !j.bayar_konsultasi, // sudah pulang inap dan belum bayar
                  j.soapDokter && !j.bayar_konsultasi // keluar klinik dan belum bayar
                ]) ? [
                  ...[ // daftar tindakan
                    ...(_.get(j, 'soapDokter.tindakan') || []),
                    j.observasi ? j.observasi.flatMap(k => k.tindakan) : []
                  ].map(k => k.idtindakan ? [
                    lookReferences(k.idtindakan).nama,
                    +lookReferences(k.idtindakan).harga
                  ] : []),
                  ...[ // daftar obat
                    ...(_.get(j, 'soapDokter.obat') || []),
                    j.observasi ? j.observasi.flatMap(k => k.obat) : []
                  ].map(k => k.idbarang ? [
                    state.goodsList.find(l => l._id === k.idbarang).nama,
                    k.harga // harga yg sudah dihitungkan ke pasien
                  ] : []),
                  ...[ //daftar bhp terpakai saat rawatan
                    ...(_.get(j, 'soapDokter.bhp') || []),
                    j.observasi ? j.observasi.flatMap(k => k.bhp) : []
                  ].map(k => k.idbarang ? withThis(
                    state.goodsList.find(l => l._id === k.idbarang),
                    barang => [
                      barang.nama, // carikan harga batch tertinggi di apotik
                      barang.batch.filter(l => l.stok.apotik)
                      .sort((a, b) => b.harga.jual - a.harga.jual)[0].harga.jual
                    ]
                  ) : [])
                ] : []
              ].filter(k => k.length).map(k => ({item: k[0], harga: k[1]})),
              bills => state.modalCashier = m('.box',
                m('h3', 'Konfirmasi Pembayaran'),
                m('p', m('b', [i.identitas.nama_lengkap, i.identitas.no_mr].join(' / '))),
                m('table.table',
                  [...bills, ...(j.charges || [])].map(k => m('tr',
                    m('th', k.item), m('td', rupiah(k.harga))
                  )),
                  m('tr', m('th', 'Total'), m('td', rupiah(_.sum(
                    [...bills, ...(j.charges || [])].map(k => k.harga)
                  ))))
                ),
                m('.buttons',
                  m('.button.is-success',
                    {ondblclick: () => [
                      updateBoth('patients', i._id, _.assign(i, {
                        rawatJalan: (i.rawatJalan || []).map(
                          k => k.idrawat === j.idrawat ?
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
                        emergency: (i.emergency || []).map(
                          k => k.idrawat === j.idrawat ?
                          _.assign(k, {
                            bayar_pendaftaran: true,
                            bayar_konsultasi: true,
                            kasir: state.login._id
                          }) : k
                        ),
                        rawatInap: (i.emergency || []).map(
                          k => k.idrawat === j.idrawat ?
                          _.assign(k, {
                            bayar_pendaftaran: true,
                            bayar_konsultasi: true,
                            kasir: state.login._id
                          }) : k
                        ),
                      })),
                      [
                        ors([j.soapDokter, j.observasi])
                        && makePdf.bayar_konsultasi(i, j, [...bills, ...(j.charges || [])]),
                        makePdf.bayar_pendaftaran(i, j, [
                          ...(i.rawatJalan || []),
                          ...(i.emergency || [])
                        ].length)
                      ],
                      _.assign(state, {modalCashier: null, cashierList: null}),
                      m.redraw()
                    ]},
                    makeIconLabel('check', 'Sudah bayar')
                  ),
                  ors([j.soapDokter, j.observasi]) && m('.button.is-warning',
                    {onclick: () => _.assign(state, {
                      modalCashier: null, route: 'overcharge',
                      onePatient: i, oneRawat: j
                    })},
                    makeIconLabel('plus', j.charges ? 'Ganti tambahan biaya' : 'Tambahan biaya')
                  )
                )
              )
            )},
            tds([
              i.identitas.no_mr,
              i.identitas.nama_lengkap,
              hari(j.tanggal || j.tanggal_masuk),
              ors([
                j.klinik && look('klinik', j.klinik),
                j.bed && 'Rawat Inap',
                'IGD'
              ]),
              j.charges ? (j.charges.length + ' item') : ''
            ])
          )
        )
      )
    ),
    makeModal('modalCashier')
  )),

  overcharge: () => m('.content', m(autoForm({
    id: 'overcharge', schema: schemas.overcharge,
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
        state.route = 'cashier',
        m.redraw()
      ]
    )
  })))
})