/*global pdfMake hari _ ors lookUser hari rupiah look lookReferences moment state lookGoods tarifInap withThis*/

var kop = {text: 'RUMAH SAKIT MEDICARE\nJL. Dt. Laksamana No. 1, Pangkalan Kuras, Pelalawan, Provinsi Riau.\n\n', alignment: 'center', bold: true},
makePdf = {
  card: identitas =>
    pdfMake.createPdf({
      content: [
        'Nama: '+identitas.nama_lengkap,
        'No. MR: '+identitas.no_mr
      ],
      pageSize: 'B8',
      pageMargins: [110, 50, 0, 0],
      pageOrientation: 'landscape'
    }).download('kartu_peserta '+identitas.no_mr)
  ,

  consent: identitas =>
    pdfMake.createPdf({content: [
      kop,
      {text: 'Data Umum Pasien\n', alignment: 'center'},
      {columns: [
        ['No. MR', 'Nama Lengkap', 'Tempat & Tanggal Lahir', 'Nama Ibu', 'Alamat', 'Kontak'],
        [
          identitas.no_mr,
          identitas.nama_lengkap,
          (identitas.tempat_lahir || '')+', '+hari(identitas.tanggal_lahir),
          _.get(identitas.keluarga, 'ibu') || '',
          identitas.alamat || '',
          identitas.kontak || ''
        ].map(i => ': '+i)
      ]},
      {text: '\nPersetujuan Umum General Consent\n', alignment: 'center'},
      {table: {body: [
        ['S', 'TS', {text: 'Keterangan', alignment: 'center'}],
        ['', '', 'Saya akan mentaati peraturan yang berlaku di RS Medicare.'],
        ['', '', 'Saya memberi kuasa kepada dokter dan semua tenaga kesehatan untuk melakukan pemeriksaan / pengobatan / tindakan yang diperlukan dalam upaya kesembuhan saya / pasien tersebut diatas.'],
        ['', '', 'Saya memberi kuasa kepada dokter dan semua tenaga kesehatan yang ikut merawat saya untuk memberikan keterangan medis saya kepada yang bertanggungjawab atas biaya perawatan saya.'],
        ['', '', 'Saya memberi kuasa kepada RS Medicare untuk menginformasikan identitas sosial saya kepada keluarga / rekan / masyarakat.'],
        ['', '', 'Saya mengatakan bahwa informasi hasil pemeriksaan / rekam medis saya dapat digunakan untuk pendidikan / penelitian demi kemajuan ilmu kesehatan.']
      ]}},
      '\nPetunjuk :\nS: Setuju\nTS: Tidak Setuju',
      {alignment: 'justify', columns: [
        {text: '\n\n\n\n__________________\n'+state.login.nama, alignment: 'center'},
        {text: 'Pangkalan Kuras, '+hari(_.now())+'\n\n\n\n__________________\nPasien', alignment: 'center'}
      ]}
    ]}).download('general_consent_'+identitas.no_mr)
  ,

  bayar_pendaftaran: (identitas, rawat, rawatLength) =>
    pdfMake.createPdf({content: [kop, {columns: [
      ['Tanggal', 'No. MR', 'Nama Pasien', 'Tarif', 'Petugas'],
      [
        hari(_.now()),
        identitas.no_mr,
        identitas.nama_lengkap,
        'Total: '+rupiah(_.sum([
          rawatLength === 1 ? 8000 : 0,
          1000*+look('tarif_klinik', rawat.klinik)
        ])),
        state.login.nama
      ].map(i => ': '+i)
    ]}]}).download('bayar_pendaftaran_'+identitas.no_mr)
  ,

  bayar_konsultasi: (identitas, rawat) => withThis(
    {
      tindakans: _.get(rawat, 'soapDokter.tindakan') &&
      rawat.soapDokter.tindakan.map(i => withThis(
        lookReferences(i.idtindakan),
        item => [item.nama, +item.harga]
      )),
      obats: _.get(rawat, 'soapDokter.obat') &&
      rawat.soapDokter.obat.map(i => withThis(
        state.goodsList.find(j => j._id === i.idbarang),
        item => [item.nama, i.harga]
      )),
      observasi: rawat.observasi && _.compact(
        rawat.observasi.flatMap(i => [
          i.tindakan && i.tindakan.flatMap(j => withThis(
            lookReferences(j.idtindakan),
            item => [item.nama, +item.harga]
          )),
          i.obat && i.obat.flatMap(j => withThis(
            state.goodsList.find(k => k._id === j.idbarang),
            item => [item.nama, j.harga]
          ))
        ])
      )
    },
    ({tindakans, obats, observasi}) =>
      pdfMake.createPdf({content: [
        kop, '\n',
        {columns: [
          ['No. MR', 'Nama Pasien', 'Jenis Kelamin', 'Tanggal Lahir', 'Umur', 'Layanan'],
          [
            identitas.no_mr,
            _.startCase(identitas.nama_lengkap),
            look('kelamin', identitas.kelamin).label || '-',
            hari(identitas.tanggal_lahir),
            moment().diff(identitas.tanggal_lahir, 'years')+' tahun',
            ors([
              rawat.idinap && 'Rawat Inap',
              rawat.klinik && look('klinik', rawat.klinik).label,
              'Gawat Darurat'
            ])
          ]
        ]},
        {text: '\n\nRincian Pembayaran', alignment: 'center'},
        {table: {widths: ['*', 'auto'], body: _.concat(
          [['Uraian', 'Harga']],
          !rawat.klinik && !rawat.idinap ? [['Layanan IGD', rupiah(45000)]] : [],
          tindakans ? tindakans.map(i => [i[0], rupiah(i[1])]) : [],
          obats ? obats.map(i => [i[0], rupiah(i[1])]) : [],
          rawat.observasi ? [['Biaya inap', rupiah(tarifInap(
            rawat.tanggal_masuk, rawat.keluar, rawat.kelas_bed)
          )]] : [],
          observasi ? observasi.map(i => [i[0], rupiah(i[1])]) : []
        )}},
        '\nTotal Biaya '+rupiah(_.sum([
          !rawat.klinik && !rawat.kode_bed && 45000,
          tindakans && tindakans.reduce((res, inc) => res + inc[1], 0),
          obats && obats.reduce((res, inc) => res + inc[1], 0),
          rawat.observasi && _.sum([
            tarifInap(rawat.tanggal_masuk, rawat.keluar, rawat.kelas_bed),
            _.sum(observasi.map(j => j[1]))
          ])
        ])),
        {text: '\nP. Kuras, '+hari(_.now())+'\n\n\n\n\nPetugas', alignment: 'right'}
      ]}).download('bayar_konsultasi '+identitas.no_mr)
  ),

  soap: (identitas, rawat) =>
    pdfMake.createPdf({content: [
      kop,
      {table: {widths: ['auto', '*', 'auto'], body: [
        ['Nama: '+identitas.nama_lengkap, 'Tanggal lahir: '+hari(identitas.tanggal_lahir), 'No. MR: '+identitas.no_mr],
        ['Kelamin: '+look('kelamin', identitas.kelamin), 'Tanggal kunjungan: '+hari(rawat.tanggal), 'Gol. Darah: '+look('darah', identitas.darah)],
        ['Klinik: '+look('klinik', rawat.klinik), 'Tanggal cetak: '+hari(_.now()), 'Cara bayar: '+look('cara_bayar', rawat.cara_bayar)],
        ['Perawat: '+(lookUser(_.get(rawat, 'soapPerawat.perawat')) || '-'), 'Dokter: '+(lookUser(_.get(rawat, 'soapDokter.dokter')) || '-'), '']
      ]}},
      rawat.soapPerawat && [
        {text: '\nSOAP Perawat', alignment: 'center', bold: true},
        {table: {widths: ['*', '*', '*'], body: [
          [
            'Tinggi/Berat: '+(_.get(rawat, 'soapPerawat.fisik.tinggi') || '-')+'/'+(_.get(rawat, 'soapPerawat.fisik.berat') || '-'),
            'Suhu: '+(_.get(rawat, 'soapPerawat.fisik.suhu') || '-')+' C', 'LILA: '+(_.get(rawat, 'soapPerawat.fisik.lila') || '-')],
          [
            'Pernapasan: '+(_.get(rawat, 'soapPerawat.fisik.pernapasan') || '-'), 'Nadi: '+(_.get(rawat, 'soapPerawat.fisik.nadi') || '-'),
            'Tekanan darah: '+_.join(_.values(_.get(rawat, 'soapPerawat.fisik.tekanan_darah') || '-'), '/')
          ]
        ]}}, '\n',
        {table: {widths: ['auto', '*'], body: [
          ['Anamnesa perawat', (_.get(rawat, 'soapPerawat.anamnesa') || '-')],
          [
            'Rujukan: '+look('rujukan', _.get(rawat, 'soapPerawat.rujukan')),
            'Sumber: '+(_.get(rawat, 'soapPerawat.sumber_rujukan') || '-')
          ],
        ]}},
      ],
      rawat.soapDokter && [
        {text: '\nSOAP Dokter', alignment: 'center', bold: true},
        {table: {widths: ['auto', '*'], body: [
          ['Anamnesa dokter', (_.get(rawat, 'soapDokter.anamnesa') || '-')],
          ['Planning', (_.get(rawat, 'soapDokter.planning') || '-')]
        ]}},
        _.get(rawat, 'soapDokter.diagnosa') && [
          {text: '\nDiagnosa', alignment: 'center'},
          {table: {widths: ['*', 'auto'], body:
            [['Teks', 'ICD10']].concat(
              _.get(rawat, 'soapDokter.diagnosa')
              .map(i => [i.text, i.code || '-'])
            )
          }},
        ],
        _.get(rawat, 'soapDokter.tindakan') && [
          {text: '\nTindakan', alignment: 'center'},
          {table: {widths: ['*', 'auto'], body: ([]).concat(
            [['Nama Tindakan', 'ICD9-CM']],
            _.get(rawat, 'soapDokter.tindakan').map(i =>
              [lookReferences(i.idtindakan).nama, i.code || '-']
            )
          )}},
        ],
        _.get(rawat, 'soapDokter.obat') && [
          {text: '\nObat', alignment: 'center'},
          {table: {widths: ['*', 'auto', 'auto'], body: ([]).concat(
            [['Nama obat', 'Jumlah', 'Puyer']],
            _.get(rawat, 'soapDokter.obat').map(i => [
              _.get(lookGoods(i.idbarang), 'nama'),
              i.jumlah, i.puyer || '-'
            ])
          )}}
        ]
      ]
    ]}).download('soap')
  ,

  resep: (identitas, drugs) =>
    pdfMake.createPdf({content: [
      kop,
      {text: 'Salinan Resep\n\n', alignment: 'center', bold: true},
      {table: {widths: ['*', 'auto'], body: ([]).concat(
        [['Nama Obat', 'Jumlah', 'Kali', 'Dosis', 'Puyer']],
        drugs.map(i => [
          i.nama_barang, i.serahkan+' unit',
          _.get(i, 'aturan.kali') || '-', _.get(i, 'aturan.dosis') || '-', i.puyer
        ])
      )}},
      {alignment: 'justify', columns: [
        {text: '', alignment: 'center'},
        {text: '\nPangkalan Kuras, '+hari(_.now())+'\n\n\n\n__________________\n'+state.login.nama, alignment: 'center'}
      ]},
      {text: '\n\n-------------------------------------potong disini------------------------------------------', alignment: 'center'},
      {text: '\nInstruksi penyerahan obat'},
      {table: {body: ([]).concat(
        [['Nama Barang', 'No. Batch', 'Jumlah']],
        drugs.map(i =>
          [i.nama_barang, i.no_batch, i.serahkan]
        )
      )}}
    ]}).download('salinan resep '+identitas.no_mr)
  ,

  report: (title, rows) =>
    pdfMake.createPdf({content: [
      kop,
      {text: title, alignment: 'center', bold: true},
      {table: {
        widths: _.range(rows[0].length).map(i => '*'),
        body: rows
      }}
    ]}).download('laporan_'+title),

  regQueue: (last) =>
    pdfMake.createPdf({
      content: [{text: last+1}],
      pageSize: 'B8'
    }).download('antrian_pendaftaran_'+(last+1))
}