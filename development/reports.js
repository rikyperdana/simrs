/*global _ m makeReport withThis moment db makePdf hari look rupiah tarifIGD lookReferences ors lookUser lookGoods selects ands beds tarifInap tomorrow*/

var reports = {

  cashier: () => makeReport(
    'Penerimaan Kasir',
    e => withThis(
      {
        start: +moment(e.target[0].value),
        end: tomorrow(+moment(e.target[1].value)),
        selection: _.get(e, 'target.2.value')
      },
      obj => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Penerimaan Kasir',
          [
            ['Tanggal', 'No. MR', 'Nama Pasien', 'Layanan', 'Tarif', 'Obat', 'Tindakan', 'Tambahan', 'Jumlah', 'Kasir'],
            ..._.flattenDeep(array.map(
              i => [
                ...(i.rawatJalan || []),
                ...(i.emergency || []),
                ...(i.rawatInap ? i.rawatInap.map(
                  j => _.assign(j, {soapDokter: {
                    obat: (j.observasi || []).flatMap(k => k.obat || []),
                    bhp: (j.observasi || []).flatMap(k => k.bhp || []),
                    tindakan: (j.observasi || []).flatMap(k => k.tindakan || [])
                  }})
                ) : [])
              ].map(j => ands([
                +obj.selection ? j.cara_bayar === +obj.selection : true,
                (j.tanggal || j.tanggal_masuk) > obj.start,
                (j.tanggal || j.tanggal_masuk) < obj.end,
                +obj.selection === 1 ? j.bayar_konsultasi : true,
                {pasien: i, rawat: j}
              ])).filter(Boolean)
            ).filter(l => l.length))
            .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
            .map(i => [
              hari(i.rawat.tanggal || i.rawat.tanggal_masuk),
              String(i.pasien.identitas.no_mr),
              i.pasien.identitas.nama_lengkap,
              ors([ // pilihan layanan
                i.rawat.klinik && look('klinik', i.rawat.klinik),
                i.rawat.bed && 'Rawat Inap', 'IGD'
              ]),
              rupiah(ors([ // tarif layanan tersebut
                i.rawat.klinik &&
                +look('tarif_klinik', i.rawat.klinik)*1000,
                i.rawat.bed && tarifInap(
                  i.rawat.tanggal_masuk, i.rawat.keluar,
                  beds[_.get(i.rawat.bed, 'kelas')].tarif
                ),
                tarifIGD
              ])),
              rupiah(_.get(i, 'rawat.soapDokter.obat') ? _.sum(
                i.rawat.soapDokter.obat.map(j => j.harga)
              ) : 0),
              rupiah(_.get(i, 'rawat.soapDokter.tindakan') ? _.sum(
                i.rawat.soapDokter.tindakan.map(
                  j => +_.get(lookReferences(j.idtindakan), 'harga')
                )
              ) : 0),
              rupiah(_.sum(
                (i.rawat.charges || [])
                .map(j => j.harga)
              )),
              rupiah(_.sum([
                ors([
                  i.rawat.klinik &&
                  +look('tarif_klinik', i.rawat.klinik)*1000,
                  i.rawat.bed && tarifInap(
                    i.rawat.tanggal_masuk, i.rawat.keluar,
                    beds[_.get(i.rawat.bed, 'kelas')].tarif
                  ),
                  tarifIGD
                ]),
                _.get(i, 'rawat.soapDokter.obat') ? _.sum(
                  i.rawat.soapDokter.obat.map(j => j.harga)
                ) : 0,
                _.get(i, 'rawat.soapDokter.tindakan') ? _.sum(
                  i.rawat.soapDokter.tindakan.map(
                    j => +_.get(lookReferences(j.idtindakan), 'harga')
                  )
                ) : 0,
                _.get(i, 'rawat.charges') ? _.sum(
                  i.rawat.charges.map(j => j.harga)
                ) : 0
              ])),
              lookUser(i.rawat.kasir)
            ])
          ],
          'Cara Bayar: '+ (+obj.selection ? look('cara_bayar', +obj.selection) : 'Semua')
        ))
      ]
    ),
    selects('cara_bayar')()
  ),

  sales: () => makeReport('Penjualan Bebas', e => withThis(
    {
      start: +moment(e.target[0].value),
      end: tomorrow(+moment(e.target[1].value))
    },
    date => [
      e.preventDefault(),
      db.goods.toArray(array => makePdf.report(
        'Laporan Penjualan Bebas',
        [
          ['Tanggal', 'Nama Barang', 'No. Batch', 'Jumlah', 'Harga', 'Apoteker'],
          ..._.flattenDeep(array.map(i => i.batch.map(
            j => j.penjualan && j.penjualan.map(
              k => ({barang: i, batch: j, penjualan: k})
            )
          ))).filter(Boolean)
          .sort((a, b) => a.penjualan.tanggal - b.penjualan.tanggal)
          .map(i => [
            hari(i.penjualan.tanggal, true),
            i.barang.nama, i.batch.no_batch,
            i.penjualan.jumlah,
            rupiah(i.batch.harga.jual),
            lookUser(i.penjualan.user)
          ])
        ]
      ))
    ]
  )),

  transfer: () => makeReport(
    'Riwayat Mutasi Barang',
    e => withThis(
      {
        start: +moment(e.target[0].value),
        end: tomorrow(+moment(e.target[1].value))
      },
      date => [
        e.preventDefault(),
        db.goods.toArray(array => makePdf.report(
          'Riwayat Mutasi Barang',
          [
            ['No. Batch', 'Nama ', 'Jenis', 'Tanggal Minta', 'Peminta', 'Diminta', 'Diserah',  'Penyerah', 'Tanggal Serah'],
            ..._.flattenDeep(array.map(i => (i.batch || []).map(
              j => (j.amprah || []).map(
                k => ({barang: i, batch: j, amprah: k})
              )
            ))).filter(Boolean)
            .sort((a, b) => a.amprah.tanggal_minta - b.amprah.tanggal_minta)
            .map(i => [
              i.batch.no_batch, i.barang.nama,
              look('jenis_barang', i.barang.jenis),
              hari(i.amprah.tanggal_minta, true),
              lookUser(i.amprah.peminta),
              i.amprah.diminta, i.amprah.diserah,
              lookUser(i.amprah.penyerah),
              hari(i.amprah.tanggal_minta, true),
            ])
          ]
        ))
      ]
    )
  ),

  pharmacy: () => makeReport('Pengeluaran Apotik', e => withThis(
    {
      start: +moment(e.target[0].value),
      end: tomorrow(+moment(e.target[1].value))
    },
    date => [
      e.preventDefault(),
      db.patients.toArray(array => makePdf.report(
        'Laporan Pengeluaran Obat',
        [
          ['Tanggal', 'No. MR', 'Nama Pasien', 'Layanan', 'Dokter', 'Nama Obat', 'Jumlah', 'Harga', 'Cara Bayar', 'Apoteker'],
          ...array.flatMap(pasien =>
            [
              ...(pasien.rawatJalan || []),
              ...(pasien.emergency || []),
              ...((pasien.rawatInap || []).flatMap(i =>
                (i.observasi || []).filter(j => j.soapDokter)
              ))
            ].map(i => ({pasien, rawat: i}))
          )
          .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
          .flatMap(({pasien, rawat}) =>
            _.get(rawat, 'soapDokter.obat') &&
            rawat.soapDokter.obat.map(i => i.harga && [
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
              i.jumlah+' '+look('satuan', lookGoods(i.idbarang).satuan),
              rupiah(i.harga),
              look('cara_bayar', rawat.cara_bayar),
              lookUser(_.get(rawat, 'soapDokter.apoteker'))
            ]).filter(Boolean)
          ).filter(Boolean).filter(i => i.length)
        ]
      ))
    ]
  )),

  igd: () => makeReport('Kunjungan IGD', e => withThis(
    {
      start: +moment(e.target[0].value),
      end: tomorrow(+moment(e.target[1].value))
    },
    date => [
      e.preventDefault(),
      db.patients.toArray(array => makePdf.report(
        'Kunjungan IGD',
        [
          ['Tanggal', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter'],
          ...array.flatMap(pasien =>
            pasien.rawatJalan &&
            pasien.rawatJalan.map(rawat =>
              _.every([
                rawat.soapDokter,
                rawat.tanggal > date.start && rawat.tanggal < date.end
              ]) && [
                hari(rawat.tanggal),
                pasien.identitas.no_mr.toString(),
                pasien.identitas.nama_lengkap,
                lookUser(_.get(rawat, 'soapPerawat.perawat')),
                lookUser(_.get(rawat, 'soapDokter.dokter'))
              ]
            )
          )
          .sort((a, b) => a.tanggal - b.tanggal)
          .filter(i => i)
        ]
      ))
    ]
  )),

  inpatient: () => makeReport('Kunjungan Rawat Inap', e => withThis(
    {
      start: +moment(e.target[0].value),
      end: tomorrow(+moment(e.target[1].value))
    },
    date => [
      e.preventDefault(),
      db.patients.toArray(array => makePdf.report(
        'Kunjungan Rawat Inap',
        [
          ['Tanggal', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter'],
          ...array.flatMap(pasien =>
            pasien.rawatInap &&
            pasien.rawatInap.map(rawat =>
              _.every([
                rawat.keluar,
                rawat.tanggal_masuk > date.start &&
                rawat.tanggal_masuk < date.end
              ]) && [
                hari(rawat.tanggal_masuk),
                pasien.identitas.no_mr.toString(),
                pasien.identitas.nama_lengkap,
                rawat.observasi.map(i =>
                  lookUser(i.perawat)
                ).join(', '),
                rawat.observasi.map(i =>
                  lookUser(i.dokter)
                ).join(', ')
              ]
            )
          )
          .sort((a, b) => a.tanggal - b.tanggal)
          .filter(Boolean)
        ]
      ))
    ]
  )),

  outpatient: () => makeReport('Kunjungan Poliklinik', e => withThis(
    {
      start: +moment(e.target[0].value),
      end: tomorrow(+moment(e.target[1].value)),
      selection: _.get(e, 'target.2.value')
    },
    obj => [
      e.preventDefault(),
      db.patients.toArray(array => makePdf.report(
        'Kunjungan Poliklinik: ' + (+obj.selection ? look('klinik', +obj.selection) : 'Semua'),
        [
          ['Tanggal', 'Poliklinik', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter'],
          ...array.flatMap(pasien =>
            (pasien.rawatJalan || [])
            .map(i => ({pasien, rawat: i}))
          ).filter(({pasien, rawat}) => ands([
            rawat.soapDokter,
            rawat.tanggal > obj.start &&
            rawat.tanggal < obj.end,
            +obj.selection ? rawat.klinik === +obj.selection : true
          ]))
          .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
          .map(({pasien, rawat}) => [
            hari(rawat.tanggal),
            look('klinik', rawat.klinik),
            pasien.identitas.no_mr.toString(),
            pasien.identitas.nama_lengkap,
            lookUser(_.get(rawat, 'soapPerawat.perawat')),
            lookUser(_.get(rawat, 'soapDokter.dokter'))
          ])
        ]
      ))
    ]
  ), selects('klinik')()),

  radiology: () => makeReport(
    'Instalasi Radiologi',
    e => withThis(
      {
        start: +moment(e.target[0].value),
        end: tomorrow(+moment(e.target[1].value))
      },
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Laporan Instalasi Radiologi',
          [
            ['Nama Pasien', 'No. MR', 'Diminta', 'Grup Uji', 'Jenis Uji', 'Diproses', 'Petugas'],
            ..._.flattenDeep(array.map(i => [
              ...i.rawatJalan || []
            ].flatMap(j => _.get(j, 'soapDokter.radio') &&
              j.soapDokter.radio.map(k => ands([
                j.tanggal > date.start, j.tanggal < date.end
              ]) && {pasien: i, rawat: j, radio: k})
            ))).filter(Boolean)
            .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
            .map(i => [
              i.pasien.identitas.nama_lengkap,
              i.pasien.identitas.no_mr,
              hari(i.rawat.tanggal, true),
              _.startCase(i.radio.grup),
              _.get(lookReferences(i.radio.idradio), 'nama'),
              i.radio.tanggal ? hari(i.radio.tanggal, true) : '',
              lookUser(i.radio.petugas)
            ])
          ]
        ))
      ]
    )
  ),

  laboratory: () => makeReport(
    'Instalasi Laboratorium',
    e => withThis(
      {
        start: +moment(e.target[0].value),
        end: tomorrow(+moment(e.target[1].value))
      },
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Laporan Instalasi Laboratorium',
          [
            ['Nama Pasien', 'No. MR', 'Diminta', 'Grup Uji', 'Jenis Uji', 'Diproses', 'Petugas'],
            ..._.flattenDeep(array.map(i => [
              ...i.rawatJalan || []
            ].flatMap(j => _.get(j, 'soapDokter.labor') &&
              j.soapDokter.labor.map(k => ands([
                j.tanggal > date.start, j.tanggal < date.end
              ]) && {pasien: i, rawat: j, labor: k})
            ))).filter(Boolean)
            .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
            .map(i => [
              i.pasien.identitas.nama_lengkap,
              i.pasien.identitas.no_mr,
              hari(i.rawat.tanggal, true),
              _.startCase(i.labor.grup),
              _.get(lookReferences(i.labor.idlabor), 'nama'),
              i.labor.tanggal ? hari(i.labor.tanggal, true) : '',
              lookUser(i.labor.petugas)
            ])
          ]
        ))
      ]
    )
  )
}
