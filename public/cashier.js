/*global _ m comp db state ors ands rupiah look lookReferences updateBoth rupiah makePdf makeModal hari tarifInap tds withThis makeReport lookUser beds moment*/

_.assign(comp, {
  cashier: () => state.login.bidang !== 2 ?
  m('p', 'Hanya untuk user bidang kasir') : m('.content',
    state.login.peranan === 4 &&
    makeReport('Penerimaan Kasir (Poli & IGD)', e => withThis(
      ({
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      }),
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Penerimaan Kasir (Poli & IGD)',
          [['Tanggal', 'Poliklinik', 'No. MR', 'Nama Pasien', 'Konsultasi', 'Obat', 'Tindakan', 'Jumlah']].concat(
            _.flattenDeep(array.map(
              i => ([]).concat(i.rawatJalan || [],i.emergency || [])
              .map(j => j.bayar_konsultasi && {pasien: i, rawat: j})
              .filter(Boolean)
            ).filter(l => l.length))
            .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
            .map(i => [
              hari(i.rawat.tanggal),
              !i.rawat.klinik ? 'IGD' :
              look('klinik', i.rawat.klinik),
              String(i.pasien.identitas.no_mr),
              i.pasien.identitas.nama_lengkap,
              rupiah(
                !i.rawat.klinik ? 45000 :
                +look('tarif_klinik', i.rawat.klinik)*1000
              ),
              rupiah(i.rawat.soapDokter.obat ? _.sum(
                i.rawat.soapDokter.obat.map(j => j.harga)
              ) : 0),
              rupiah(i.rawat.soapDokter.tindakan ? _.sum(
                i.rawat.soapDokter.tindakan.map(
                  j => +lookReferences(j.idtindakan).harga
                )
              ) : 0),
              rupiah(_.sum([
                !i.rawat.klinik ? 45000 :
                +look('tarif_klinik', i.rawat.klinik)*1000,
                i.rawat.soapDokter.obat ? _.sum(
                  i.rawat.soapDokter.obat.map(j => j.harga)
                ) : 0,
                i.rawat.soapDokter.tindakan ? _.sum(
                  i.rawat.soapDokter.tindakan.map(
                    j => +lookReferences(j.idtindakan).harga
                  )
                ) : 0
              ]))
            ])
          )
        ))
      ]
    )),
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
              j.cara_bayar === 1 && ors([
                !j.bayar_pendaftaran,
                ands([j.bed, j.keluar, !j.bayar_konsultasi]),
                !j.bayar_konsultasi && j.soapDokter
              ])
            ).length
          ).toArray(array =>
            state.cashierList = array
          ),
          db.references.toArray(array =>
            state.references = array
          ),
          db.goods.toArray(array =>
            state.goodsList = array
          )
        ]},
        state.cashierList &&
        state.cashierList.map(pasien =>
          ([]).concat(
            pasien.rawatJalan ? pasien.rawatJalan : [],
            pasien.emergency ? pasien.emergency: [],
            pasien.rawatInap ? pasien.rawatInap : []
          ).map(rawat => ors([
            rawat.cara_bayar === 1 && ors([
              !rawat.bayar_pendaftaran,
              ands([
                !rawat.bayar_konsultasi,
                rawat.soapDokter
              ]) && ors([
                _.get(rawat, 'soapDokter.tindakan'),
                _.get(rawat, 'soapDokter.obat')
              ])
            ]),
            ands([
              rawat.bed, rawat.keluar,
              !rawat.bayar_konsultasi
            ])
          ]) && m('tr',
            {ondblclick: () => state.modalCashier = m('.box',
              m('h3', 'Konfirmasi Pembayaran'),
              m('table.table',
                m('tr', m('th', 'Nama Lengkap'), m('td', pasien.identitas.nama_lengkap)),
                m('tr', m('th', 'No. MR'), m('td', pasien.identitas.no_mr)),
                !rawat.bed && ands([
                  ([]).concat(pasien.rawatJalan || [], pasien.emergency || []).length === 1,
                  !rawat.bayar_pendaftaran,
                  m('tr', m('th', 'Daftar pasien baru'), m('td', rupiah(8000)))
                ]),
                ors([
                  !rawat.bayar_pendaftaran,
                  rawat.bed && rawat.keluar
                ]) && ors([
                  rawat.klinik && m('tr',
                    m('th', 'Adm + Konsultasi Poli '+look('klinik', rawat.klinik)),
                    m('td', rupiah(1000*+look('tarif_klinik', rawat.klinik)))
                  ),
                  rawat.bed && m('tr',
                    m('th', 'Biaya kamar'),
                    m('td', rupiah(tarifInap(
                      rawat.tanggal_masuk, rawat.keluar,
                      beds[_.get(rawat.bed, 'kelas')].tarif
                    )))
                  ),
                  m('tr',
                    m('th', 'Rawat IGD'),
                    m('td', rupiah(45000))
                  )
                ]),
                ands([
                  ors([
                    rawat.klinik && !rawat.bayar_konsultasi,
                    rawat.bed && !rawat.bayar_konsultasi,
                    !rawat.bayar_konsultasi
                  ]),
                  [
                    _.compact(([]).concat(
                      _.get(rawat, 'soapDokter.tindakan') || [],
                      rawat.observasi ?
                        rawat.observasi.flatMap(i => i.tindakan)
                      : []
                    )).map(i => m('tr',
                      m('th', lookReferences(i.idtindakan).nama),
                      m('td', rupiah(lookReferences(i.idtindakan).harga))
                    )),
                    _.compact(([]).concat(
                      _.get(rawat, 'soapDokter.obat') || [],
                      rawat.observasi ?
                        rawat.observasi.flatMap(i => i.obat)
                      : []
                    )).map(obat => m('tr',
                      m('th', state.goodsList.filter(i =>
                        i._id === obat.idbarang
                      )[0].nama),
                      m('td', rupiah(obat.harga))
                    ))
                  ]
                ]),
                m('tr', m('th', 'Total biaya'), m('td', rupiah(_.sum([
                  ands([
                    !rawat.bayar_pendaftaran,
                    !rawat.bed
                  ]) && _.sum([
                    ([]).concat(
                      pasien.rawatJalan || [], pasien.emergency || []
                    ).length === 1 ? 8000 : 0,
                    rawat.klinik ? 1000*+look('tarif_klinik', rawat.klinik) : 45000,
                  ]),
                  rawat.bed ? tarifInap(
                    rawat.tanggal_masuk, rawat.keluar,
                    beds[_.get(rawat.bed, 'kelas')].tarif
                  ) : 0,
                  _.sum([
                    _.compact(([]).concat(
                      _.get(rawat, 'soapDokter.tindakan') || [],
                      rawat.observasi ?
                        rawat.observasi.flatMap(i => i.tindakan)
                      : []
                    )).reduce((res, inc) =>
                      +lookReferences(inc.idtindakan).harga + res
                    , 0),
                    _.compact(([]).concat(
                      _.get(rawat, 'soapDokter.obat') || [],
                      rawat.observasi ?
                        rawat.observasi.flatMap(i => i.obat)
                      : []
                    )).reduce((res, inc) =>
                      res + inc.harga
                    , 0)
                  ])
                ]))))
              ),
              m('.button.is-success',
                {onclick: () => withThis(
                  ors([
                    rawat.klinik && 'rawatJalan',
                    rawat.bed && 'rawatInap',
                    'emergency'
                  ]),
                  facility => [
                    updateBoth('patients', pasien._id, _.assign(pasien, {
                      [facility]: pasien[facility].map(i =>
                        ors([
                          rawat.idrawat && i.idrawat === rawat.idrawat,
                          rawat.idinap && i.idinap === rawat.idinap
                        ]) ? _.assign(rawat, ors([
                          !rawat.klinik && rawat.soapDokter &&
                          {bayar_pendaftaran: true, bayar_konsultasi: true},
                          !rawat.bayar_pendaftaran && {bayar_pendaftaran: true},
                          !rawat.bayar_konsultasi && {bayar_konsultasi: true}
                        ])) : i
                      )
                    })),
                    ors([
                      rawat.klinik && !rawat.soapDokter &&
                      makePdf.bayar_pendaftaran(
                        pasien.identitas, rawat, ([]).concat(
                          pasien.rawatJalan ? pasien.rawatJalan : [],
                          pasien.emergency ? pasien.emergency : []
                        ).length
                      ),
                      ors([
                        !rawat.klinik,
                        rawat.bayar_pendaftaran && rawat.bayar_konsultasi
                      ]) && makePdf.bayar_konsultasi(pasien.identitas, rawat)
                    ]),
                    state.modalCashier = null,
                    state.cashierList = null,
                    m.redraw()
                  ]
                )},
                m('span.icon', m('i.fas.fa-check')),
                m('span', 'Sudah bayar')
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
              ])
            ])
          )
        )
      ) // display each person bills
    ),
    makeModal('modalCashier')
  )),
})