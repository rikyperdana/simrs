/*global ors _ state selects randomId beds ands withThis lookReferences*/

var schemas = {
  identitas: {
    no_antrian: {type: String, optional: true, exclude: true},
    no_mr: {
      type: Number, label: 'No. MR',
      autoform: {help: 'random dari sistem and boleh diubah'},
      autoValue: (name, doc, opts) =>
        // jika update, gunakan No. MR yg sudah ada
        opts.id === 'updatePatient' ?
        _.get(state, 'onePatient.identitas.no_mr')
        // No. MR otomatis 6 angka, silahkan naikkan jika perlu
        : Math.floor(Math.random() * 1e6)
    },
    alias: {
      type: Number, optional: true,
      autoform: {type: 'select', options: selects('alias')}
    },
    nama_lengkap: {type: String, autoform: {placeholder: 'minimal 4 huruf'}},
    ktp: {type: Number, label: 'No. KTP', optional: true},
    bpjs: {type: Number, label: 'No. Peserta BPJS', optional: true},
    tanggal_lahir: {type: Date},
    tempat_lahir: {type: String},
    kelamin: {
      type: Number, label: 'Jenis Kelamin',
      autoform: {type: 'select', options: selects('kelamin')}
    },
    agama: {
      type: Number, optional: true,
      autoform: {type: 'select', options: selects('agama')}
    },
    nikah: {
      type: Number, label: 'Status Nikah', optional: true,
      autoform: {type: 'select', options: selects('nikah')}
    },
    pendidikan: {
      type: Number, label: 'Pendidikan Terakhir', optional: true,
      autoform: {type: 'select', options: selects('pendidikan')}
    },
    darah: {
      type: Number, label: 'Golongan Darah', optional: true,
      autoform: {type: 'select', options: selects('darah')}
    },
    pekerjaan: {
      type: Number, label: 'Pekerjaan sekarang', optional: true,
      autoform: {type: 'select', options: selects('pekerjaan')}
    },
    tempat_tinggal: {type: String, optional: true, label: 'Alamat tempat tinggal'},
    kontak: {type: Number, optional: true, label: 'No. Handphone'},
    keluarga: {type: Object},
    'keluarga.ayah': {type: String, optional: true, label: 'Nama Ayah'},
    'keluarga.ibu': {type: String, optional: true, label: 'Nama Ibu'},
    'keluarga.pasangan': {type: String, optional: true, label: 'Nama Suami/Istri'},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () =>_.get(state.login, '_id')
    },
    tanggal_input: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  rawatJalan: {
    idrawat: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    tanggal: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    },
    no_antrian: {type: String, optional: true, exclude: true},
    cara_bayar: {type: Number, autoform: {
      type: 'select', options: selects('cara_bayar')
    }},
    no_sep: {
      type: String, optional: true,
      autoform: {placeholder: 'isikan bila cara bayar bpjs'}
    },
    klinik: {type: Number, autoform: {
      type: 'select', options: selects('klinik')
    }},
    rujukan: {type: Number, autoform: {
      type: 'select', options: selects('rujukan')
    }},
    sumber_rujukan: {type: String, optional: true},
    penanggungjawab: {type: String, optional: true}
  },

  soapPerawat: {
    anamnesa: {type: String, autoform: {type: 'textarea'}},
    fisik: {type: Object},
    'fisik.tekanan_darah': {type: Object,},
    'fisik.tekanan_darah.systolic': {type: Number, optional: true},
    'fisik.tekanan_darah.diastolic': {type: Number, optional: true},
    'fisik.nadi': {type: Number, optional: true},
    'fisik.suhu': {type: Number, optional: true},
    'fisik.pernapasan': {type: Number, optional: true},
    'fisik.tinggi': {type: Number, optional: true},
    'fisik.berat': {type: Number, optional: true},
    'fisik.lila': {type: Number, optional: true, label: 'Lingkar lengan atas'},
    tracer: {type: String, optional: true, label: 'File Tracer'},
    perawat: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  soapDokter: {
    anamnesa: {type: String, autoform: {type: 'textarea'}},
    diagnosa: {type: Array},
    'diagnosa.$': {type: Object},
    'diagnosa.$.text': {type: String},
    tindakan: {type: Array, optional: true},
    'tindakan.$': {type: Object},
    'tindakan.$.idtindakan': {type: String, autoform: {
      type: 'select', options: (name, doc) =>
        _.sortBy(state.daftarTindakan.map(i =>
          ({value: i._id, label: i.nama})
        ), ['label'])
    }},
    'tindakan.$.jadwal': {
      type: Date, optional: true, autoform: {
        type: 'datetime-local',
        help: 'Hanya untuk penjadwalan kedepan'
      }
    },
    bhp: {type: Array, optional: true, label: 'Barang habis pakai'},
    'bhp.$': {type: Object},
    'bhp.$.idbarang': {
      type: String, label: 'Nama Barang',
      autoform: {type: 'select', options: () =>
        state.bhpList
        .sort((a, b) => a.nama > b.nama ? 1 : -1)
        .map(i => ({value: i._id, label: i.nama}))
      }
    },
    'bhp.$.jumlah': {type: Number},
    obat: {type: Array, optional: true},
    'obat.$': {type: Object},
    'obat.$.search': {
      type: String, optional: true,
      autoRedraw: true, label: 'Pencarian obat',
      autoform: {placeholder: 'Gunakan huruf kecil'}
    },
    'obat.$.idbarang': {
      type: String, label: 'Nama Obat', autoform: {
        type: 'select', options: (name, doc) =>
          state.drugList.filter(i => withThis(
            _.get(doc, _.initial(name.split('.')).join('.')+'.search'),
            search => search ? _.includes(_.lowerCase(i.nama), search) : true
          ))
          .sort((a, b) => a.nama > b.nama ? 1 : -1)
          .map(i => ({value: i._id, label: i.nama}))
      }
    },
    'obat.$.jumlah': {type: Number},
    'obat.$.puyer': {
      type: Number, optional: true,
      autoform: {help: 'Kode unik puyer'}
    },
    'obat.$.aturan': {type: Object, optional: true},
    'obat.$.aturan.kali': {type: Number},
    'obat.$.aturan.dosis': {type: String},
    radio: {type: Array, optional: true, label: 'Radiologi'},
    'radio.$': {type: Object},
    'radio.$.grup': {
      type: String, optional: true, autoRedraw: true,
      autoform: {
        help: 'Saring berdasarkan kategori',
        type: 'select', options: () => _.uniq(
          state.references
          .filter(i => i[0] === 'radiologi')
          .map(i => i[1])
        ).map(i => ({value: i, label: _.startCase(i)}))
      }
    },
    'radio.$.idradio': {type: String, autoform: {
      type: 'select', options: (name, doc) =>
        _.sortBy(
          state.references.filter(i => ands([
            i[0] === 'radiologi',
            withThis(
              _.initial(name.split('.')).join('.') + '.grup',
              siblingGrup => _.get(doc, siblingGrup) ?
                doc[siblingGrup] === i[1] : true
            )
          ]))
          .map(i => ({value: i._id, label: i.nama})),
          'label'
        )
    }},
    'radio.$.catatan': {type: String, optional: true},
    labor: {type: Array, optional: true, label: 'Laboratorium'},
    'labor.$': {type: Object},
    'labor.$.grup': {
      type: String, optional: true, autoRedraw: true,
      autoform: {
        help: 'Saring berdasarkan kategori',
        type: 'select', options: () => _.uniq(
          state.references
          .filter(i => i[0] === 'laboratorium')
          .map(i => i[1])
        ).map(i => ({value: i, label: _.startCase(i)}))
      }
    },
    'labor.$.idlabor': {type: String, autoform: {
      type: 'select', options: (name, doc) =>
        _.sortBy(
          state.references.filter(i => ands([
            i[0] === 'laboratorium',
            withThis(
              _.initial(name.split('.')).join('.') + '.grup',
              siblingGrup => _.get(doc, siblingGrup) ?
                doc[siblingGrup] === i[1] : true
            )
          ]))
          .map(i => ({value: i._id, label: i.nama})),
          'label'
        )
    }},
    planning: {
      type: String, optional: true,
      autoform: {type: 'textarea'}
    },
    keluar: {type: Number, autoform: {
      type: 'select', options: selects('keluar')
    }},
    rujuk: {
      type: Number, optional: true, label: 'Konsultasikan ke',
      autoform: {
        type: 'select',
        help: 'Hanya diisi bila pilihan keluar adalah Konsultasikan ke Poliklinik lain',
        options: selects('klinik')
      }
    },
    tracer: {type: String, optional: true, label: 'File Tracer'},
    spm: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now() - state.spm
    },
    dokter: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    },
    tanggal: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  account: {
    nama: {type: String, label: 'Nama lengkap'},
    username: {type: String},
    password: {type: String, autoform: {type: 'password'}},
    peranan: {type: Number, autoform: {
      type: 'select', options: selects('peranan')
    }},
    bidang: {type: Number, optional: true, autoform: {
      type: 'select', options: selects('bidang')
    }},
    poliklinik: {type: Number, optional: true, autoform: {
      type: 'select', options: selects('klinik'),
      help: 'hanya diisi bila pilihan bidang Rawat Jalan'
    }},
    keaktifan: {type: Number, autoform: {
      type: 'select', options: selects('keaktifan')
    }}
  },

  barang: {
    nama: {type: String},
    jenis: {type: Number, autoform: {
      type: 'select', options: selects('jenis_barang')
    }},
    kandungan: {type: String, optional: true},
    satuan: {type: Number, autoform: {
      type: 'select', options: selects('satuan')
    }},
    stok_minimum: {type: Object},
    'stok_minimum.gudang': {type: Number},
    'stok_minimum.apotik': {type: Number},
    kriteria: {type: Object, optional: true},
    'kriteria.antibiotik': {
      type: Number, optional: true, autoform: {
        type: 'select', options: selects('boolean')
      }
    },
    'kriteria.narkotika': {
      type: Number, optional: true, autoform: {
        type: 'select', options: selects('boolean')
      }
    },
    'kriteria.psikotropika': {
      type: Number, optional: true, autoform: {
        type: 'select', options: selects('boolean')
      }
    },
    'kriteria.fornas': {
      type: Number, optional: true, autoform: {
        type: 'select', options: selects('boolean')
      }
    },
    kode_rak: {type: String, optional: true, label: 'Kode Rak Apotik'},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  batch: {
    idbatch: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    no_batch: {type: String},
    merek: {type: String},
    masuk: {type: Date},
    kadaluarsa: {type: Date},
    stok: {type: Object},
    'stok.gudang': {type: Number, autoform: {help: 'Berdasarkan unit terkecil'}},
    harga: {type: Object},
    'harga.beli': {type: Number},
    'harga.jual': {type: Number},
    sumber: {type: Object},
    'sumber.supplier': {type: String},
    'sumber.anggaran': {type: String, optional: true},
    'sumber.no_spk': {type: String, optional: true},
    'sumber.tanggal_spk': {type: Date, optional: true},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  amprah: {
    idamprah: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    ruangan: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => ors([
        _.get(state.login, 'bidang'),
        _.get(state.login, 'poliklinik')
      ])
    },
    peminta: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    },
    diminta: {
      type: Number, label: 'Jumlah diminta',
      minMax: () => [1, _.get(state, 'oneBatch.stok.gudang')]
    },
    tanggal_minta: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  responAmprah: {
    diserah: {
      type: Number, label: 'Jumlah diserahkan',
      minMax: () => [1, _.get(state, 'oneAmprah.digudang')]
    },
    penyerah: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    },
    tanggal_serah: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  login: {
    username: {type: String},
    password: {type: String, autoform: {type: 'password'}}
  },

  beds: {
    kelas: {type: String, autoform: {
      type: 'select', options: () => _.keys(beds).map(
        j => ({value: j, label: _.upperCase(j)})
      )
    }},
    kamar: {type: String, autoform: {
      type: 'select', options: () =>
        _.flatten(_.values(beds).map(j => _.keys(j.kamar)))
        .map(j => ({value: j, label: _.startCase(j)}))
    }},
    nomor: {type: Number}
  },

  overcharge: {
    charges: {type: Array, optional: true},
    'charges.$': {type: Object},
    'charges.$.item': {type: String, label: 'Nama item'},
    'charges.$.harga': {type: Number}
  },

  confirmRadiology: {
    konfirmasi: {
      type: Number, autoform: {
        type: 'select', options: selects('konfirmasi')
      }
    },
    tanggal: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  responRadiology: {
    kode_berkas: {type: String},
    diagnosa: {type: String, autoform: {type: 'textarea', rows: 10}},
    pengarsipan: {type: Number, autoform: {
      type: 'select', options: selects('pengarsipan')
    }},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  responLaboratory: {
    labor: {type: Array, fixed: true},
    'labor.$': {type: Object},
    'labor.$.idlabor': {
      type: String, autoform: {type: 'hidden'},
      autoValue: (name, doc) => doc[name]
    },
    'labor.$.item_labor': {
      type: String, autoform: {type: 'readonly'}, exclude: true,
      autoValue: (name, doc) => lookReferences(doc[
        _.initial(name.split('.')).join('.') + '.idlabor'
      ]).nama
    },
    'labor.$.tanggal': { // tanggal pengambilan sample
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  gizi: {
    konsumsi: {
      type: String, label: 'Konsumsi gizi untuk pasien',
      optional: true, autoform: {type: 'textarea'}
    }
  },

  tarif: {
    nama: {type: String},
    harga: {type: Number}
  }
},

layouts = {
  patientForm: {
    top: [
      ['no_mr', 'no_antrian', 'ktp', 'bpjs'],
      ['alias', 'nama_lengkap', 'tanggal_lahir', 'tempat_lahir'],
      ['kelamin', 'agama', 'nikah', 'pendidikan', 'darah', 'pekerjaan'],
      ['tempat_tinggal', 'kontak'], ['keluarga'],
      ['petugas', 'tanggal_input'] // yg hidden juga
    ],
    keluarga: [['ayah', 'ibu', 'pasangan']]
  },
  poliVisit: {top: [
    ['no_antrian', 'cara_bayar', 'no_sep'],
    ['klinik', 'rujukan', 'sumber_rujukan', 'penanggungjawab'],
    ['idrawat', 'tanggal']
  ]},
  igdVisit: {top: [
    ['no_antrian', 'cara_bayar', 'no_sep'],
    ['rujukan', 'sumber_rujukan', 'penanggungjawab'],
    ['idrawat', 'tanggal']
  ]},
  soap: () => ({
    top: ors([
      state.login.peranan === 2 && [['anamnesa', 'tracer'], ['fisik'], ['perawat']],
      state.login.peranan === 3 && ors([
       state.oneInap && [
          ['anamnesa'],
          ['diagnosa', 'tindakan'], ['obat', 'bhp'],
          ['radio', 'labor'], ['planning', 'konsumsi'],
          ['tracer'], ['spm', 'dokter', 'tanggal']
        ],
        [
          ['anamnesa'],
          ['diagnosa', 'tindakan'],
          ['obat', 'bhp'],
          ['radio', 'labor'], ['planning'],
          ['keluar', 'rujuk', 'tracer'],
          ['spm', 'dokter', 'tanggal']
        ]
      ])
    ]),
    fisik: [
      ['tekanan_darah'],
      ['nadi', 'suhu', 'pernapasan'],
      ['tinggi', 'berat', 'lila']
    ],
    'fisik.tekanan_darah': [['systolic', 'diastolic']],
    'tindakan.$': [['idtindakan', 'jadwal']],
    'obat.$': [['search', 'idbarang'], ['jumlah', 'puyer'], ['aturan']],
    'bhp.$': [['idbarang', 'jumlah']],
    'radio.$': [['grup', 'idradio'], ['catatan']],
    'labor.$': [['grup', 'idlabor']],
    'obat.$.aturan': [['kali', 'dosis']]
  }),

  barang: {
    top: [
      ['nama', 'kandungan'],
      ['jenis', 'satuan', 'kode_rak'],
      ['stok_minimum', 'kriteria'],
      ['petugas']
    ],
    stok_minimum: [['gudang', 'apotik']],
    kriteria: [
      ['antibiotik', 'narkotika'],
      ['psikotropika', 'fornas']
    ]
  },

  batch: {
    top: [
      ['no_batch', 'merek', 'masuk', 'kadaluarsa'],
      ['stok', 'harga'], ['sumber'],
      ['idbatch', 'petugas']
    ],
    harga: [['beli', 'jual']],
    sumber: [['supplier', 'anggaran', 'no_spk', 'tanggal_spk']]
  },

  sales: {
    top: [['obat'], ['bhp'], ['idpenjualan']],
    'bhp.$': [['idbarang', 'jumlah']],
    'obat.$': [['search', 'idbarang'], ['jumlah', 'puyer'], ['aturan']],
    'obat.$.aturan': [['kali', 'dosis']]
  },

  account: {top: [
    ['nama'], ['username', 'password'],
    ['peranan', 'bidang'], ['poliklinik', 'keaktifan']
  ]}
}
