/*global _ m comp db state ors ands rupiah look lookReferences updateBoth rupiah makePdf makeModal hari tarifInap tds withThis makeReport lookUser beds moment tarifIGD tarifKartu reports*/

_.assign(comp, {
  cashier: () => state.login.bidang !== 2 ?
  m('p', 'Hanya untuk user bidang kasir') : m('.content',
    state.login.peranan === 4 && reports.cashier(),
    m('h3', 'Loket Pembayaran'),
    m('table.table',
      m('thead', m('tr',
        ['no_mr', 'nama_lengkap', 'tanggal', 'layanan']
        .map(i => m('th', _.startCase(i)))
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
                // yang belum bayar pendaftaran
                !j.bayar_pendaftaran,
                // sudah keluar inap tapi belum bayar
                ands([j.bed, j.keluar, !j.bayar_konsultasi]),
                // sudah keluar klinik tapi belum bayar
                !j.bayar_konsultasi && j.soapDokter
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
              !j.bayar_pendaftaran, // belum bayar pendaftaran
              ands([!j.bayar_konsultasi, j.soapDokter]) &&
              ors([ // sudah keluar klinik dan masih ada biaya tindakan &/ obat
                _.get(j, 'soapDokter.tindakan'),
                _.get(j, 'soapDokter.obat')
              ])
            ]),
            // sudah keluar inap tapi belum bayar
            ands([j.bed, j.keluar, !j.bayar_konsultasi])
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
                ors([!j.bayar_pendaftaran, j.bed && j.keluar]) ?
                ors([ // tarif layanan rawat (jalan/inap/igd)
                  j.klinik && [
                    'Adm + Konsultasi Poli '+look('klinik', j.klinik),
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
                    k.harga
                  ] : [])
                ] : []
              ].filter(k => k.length).map(k => ({item: k[0], harga: k[1]})),
              bills => state.modalCashier = m('.box',
                m('h3', 'Konfirmasi Pembayaran'),
                m('p', m('b', [i.identitas.nama_lengkap, i.identitas.no_mr].join('/'))),
                m('table.table',
                  bills.map(k => m('tr',
                    m('th', k.item), m('td', rupiah(k.harga))
                  )),
                  m('tr', m('th', 'Total'), m('td', rupiah(_.sum(bills.map(k => k.harga)))))
                 ),
                m('.button.is-success',
                  {ondblclick: () => [
                    updateBoth('patients', i._id, _.assign(i, {
                      rawatJalan: (i.rawatJalan || []).map(
                        k => k.idrawat === j.idrawat ?
                        _.assign(k, ors([
                          k.soapDokter && {bayar_konsultasi: true},
                          {bayar_pendaftaran: true},
                        ])) : k
                      ),
                      emergency: (i.emergency || []).map(
                        k => k.idrawat === j.idrawat ?
                        _.assign(k, {
                          bayar_pendaftaran: true,
                          bayar_konsultasi: true
                        }) : k
                      ),
                      rawatInap: (i.emergency || []).map(
                        k => k.idrawat === j.idrawat ?
                        _.assign(k, {
                          bayar_pendaftaran: true,
                          bayar_konsultasi: true
                        }) : k
                      ),
                    })),
                    ors([
                      ors([j.soapDokter, j.observasi])
                      && makePdf.bayar_konsultasi(i, j, bills),
                      makePdf.bayar_pendaftaran(i, j, [
                        ...(i.rawatJalan || []),
                        ...(i.emergency || [])
                      ].length)
                    ]),
                    _.assign(state, {modalCashier: null, cashierList: null}),
                    m.redraw()
                  ]},
                  m('span.icon', m('i.fas.fa-check')),
                  m('span', 'Sudah bayar')
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
              ])
            ])
          )
        )
      )
    ),
    makeModal('modalCashier')
  )),
})