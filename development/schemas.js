/*global ors _ state selects randomId beds ands withThis*/

var schemas = {
  identitas: {
    no_antrian: {type: String, optional: true, exclude: true},
    no_mr: {
      type: Number, label: 'No. MR',
      autoform: {help: 'otomatis dari sistem & boleh diubah'},
      autoValue: (name, doc, opts) => ors([
        opts.id === 'updatePatient' &&
        _.get(state, 'onePatient.identitas.no_mr'),
        Math.floor(Math.random() * 1e6)
      ])
    },
    alias: {
      type: Number, optional: true,
      autoform: {type: 'select', options: selects('alias')}
    },
    nama_lengkap: {type: String,},
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
    tempat_tinggal: {type: String, optional: true},
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
      type: Date, autoform: {type: 'hidden'},
      autoValue: () => Date()
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
    no_sep: {type: String, optional: true},
    klinik: {type: Number, autoform: {
      type: 'select', options: selects('klinik')
    }},
    rujukan: {type: Number, autoform: {
      type: 'select', options: selects('rujukan')
    }},
    sumber_rujukan: {type: String, optional: true},
    penaggungjawab: {type: String, optional: true}
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
    'fisik.lila': {type: Number, optional: true},
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
    obat: {type: Array, optional: true},
    'obat.$': {type: Object},
    'obat.$.idbarang': {
      type: String, label: 'Nama Obat',
      autoform: {type: 'select', options: () =>
        state.drugList.map(i =>
          ({value: i._id, label: i.nama})
        )
      }
    },
    'obat.$.jumlah': {type: Number},
    'obat.$.puyer': {
      type: Number, optional: true,
      autoform: {help: 'kode unik puyer'}
    },
    'obat.$.aturan': {type: Object, optional: true},
    'obat.$.aturan.kali': {type: Number},
    'obat.$.aturan.dosis': {type: String},
    planning: {
      type: String, optional: true,
      autoform: {type: 'textarea'}
    },
    rujuk: {
      type: Number, optional: true, label: 'Konsultasikan ke',
      autoform: {type: 'select', options: selects('klinik')}
    },
    keluar: {type: Number, autoform: {
      type: 'select', options: selects('keluar')
    }},
    spm: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now() - state.spm
    },
    dokter: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
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
      type: 'select', options: selects('klinik')
    }},
    keaktifan: {type: Number, autoform: {
      type: 'select', options: selects('keaktifan')
    }},
  },

  barang: {
    nama: {type: String},
    jenis: {type: Number, autoform: {
      type: 'select', options: selects('jenis_barang')
    }},
    kandungan: {type: String},
    satuan: {type: Number, autoform: {
      type: 'select', options: selects('satuan')
    }},
    stok_minimum: {type: Object},
    'stok_minimum.gudang': {type: Number},
    'stok_minimum.apotik': {type: Number},
    kriteria: {type: Object},
    'kriteria.antibiotik': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    'kriteria.narkotika': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    'kriteria.psikotropika': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    'kriteria.fornas': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  batch_obat: {
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
    nomor: {type: Number},
  },
}

localStorage.openBeta && [
  _.assign(schemas.soapDokter, {

    radio: {type: Array, optional: true},
    'radio.$': {type: Object},
    'radio.$.grup': {type: String, optional: true, autoform: {
      help: 'Saring berdasarkan kategori',
      type: 'select', options: () => _.uniq(
        state.references
        .filter(i => i[0] === 'radiologi')
        .map(i => i[1])
      ).map(i => ({value: i, label: _.startCase(i)}))
    }},
    'radio.$.idradio': {type: String, autoRedraw: true, autoform: {
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

    labor: {type: Array, optional: true},
    'labor.$': {type: Object},
    'labor.$.grup': {type: String, optional: true, autoform: {
      help: 'Saring berdasarkan kategori',
      type: 'select', options: () => _.uniq(
        state.references
        .filter(i => i[0] === 'laboratorium')
        .map(i => i[1])
      ).map(i => ({value: i, label: _.startCase(i)}))
    }},
    'labor.$.idlabor': {type: String, autoRedraw: true, autoform: {
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
    'radio.$.catatan': {type: String, optional: true},
  }),
  _.assign(schemas, {
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
    }
  })
]