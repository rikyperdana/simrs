var m, _, afState = {arrLen: {}, form: {}}

function autoForm(opts){return {view: function(){
  function normal(name){return name.replace(/\d/g, '$')}
  function ors(array){return array.filter(Boolean)[0]}
  function dateValue(timestamp, hour){
    var date = new Date(timestamp),
    dateStamp = [date.getFullYear(), date.getMonth()+1, date.getDate()].join('-'),
    zeros = function(num){return num < 10 ? '0'+num : num},
    hourStamp = 'T'+zeros(date.getHours())+':'+zeros(date.getMinutes())
    return !hour ? dateStamp : dateStamp+hourStamp
  }

  function linearize(obj){
    function recurse(doc){
      var value = doc[_.keys(doc)[0]]
      return typeof(value) === 'object' ? _.map(value, function(val, key){
        return recurse({[_.keys(doc)[0]+'.'+key]: val})
      }) : doc
    }
    return _.fromPairs(
      _.flattenDeep(recurse({doc: obj}))
      .map(function(i){return [_.keys(i)[0].substr(4), _.values(i)[0]]})
    )
  }

  afState.form[opts.id] = opts.doc ? linearize(opts.doc) : afState.form[opts.id]

  var attr = {
    form: {
      id: opts.id,
      onchange: function(e){
        e.redraw = false
        afState.form[opts.id] = afState.form[opts.id] || {}
        afState.form[opts.id][e.target.name] = e.target.value
      },
      onsubmit: function(e){
        e.preventDefault()
        afState.form[opts.id] = opts.autoReset && null
        var submit = () => opts.action(
          _.filter(e.target, function(i){return i.name && i.value})
          .map(function(obj){
            var type = opts.schema[normal(obj.name)].type
            return _.reduceRight(
              obj.name.split('.'),
              function(res, inc){return {[inc]: res}},
              obj.value && [ // value conversion
                ((type === String) && obj.value),
                ((type === Number) && +(obj.value)),
                ((type === Date) && (new Date(obj.value)).getTime())
              ].filter(function(i){return !!i})[0]
            )
          }).reduce(function(res, inc){
            function recursive(inc){return ors([
              typeof(inc) === 'object' && ors([
                +_.keys(inc)[0]+1 &&
                _.range(+_.keys(inc)[0]+1).map(function(i){
                  return i === +_.keys(inc)[0] ?
                  recursive(_.values(inc)[0]) : undefined
                }),
                {[_.keys(inc)[0]]: recursive(_.values(inc)[0])}
              ]), inc
            ])}
            return _.merge(res, recursive(inc))
          }, {})
        )
        !opts.confirmMessage ? submit() : confirm(opts.confirmMessage) && submit()
      }
    },
    arrLen: function(name, type){return {onclick: function(){
      afState.arrLen[name] = afState.arrLen[name] || 0
      var dec = afState.arrLen[name] > 0 ? -1 : 0
      afState.arrLen[name] += ({inc: 1, dec})[type]
    }}},
    label: function(name, schema){return m('label.label',
      m('span', schema.label || _.startCase(name)),
      m('span', m('b.has-text-danger', !schema.optional && ' *'))
    )}
  }

  function inputTypes(name, schema){return {
    hidden: function(){return m('input.input', {
      type: 'hidden', name: !schema.exclude ? name : '',
      value: schema.autoValue &&
        schema.autoValue(name, afState.form[opts.id], opts)
    })},
    readonly: function(){return m('.field',
      attr.label(name, schema),
      m('input.input', {
        readonly: true, name: !schema.exclude ? name : '',
        value: schema.autoValue(name, afState.form[opts.id], opts)
      })
    )},
    "datetime-local": function(){return m('.field',
      attr.label(name, schema),
      m('.control', m('input.input', {
        type: 'datetime-local',
        name: !schema.exclude ? name: '',
        required: !schema.optional,
        value: dateValue(_.get(afState.form, [opts.id, name]), true),
      }))
    )},
    textarea: function(){return m('.field',
      attr.label(name, schema),
      m('textarea.textarea', {
        name: !schema.exclude ? name : '',
        required: !schema.optional,
        value: _.get(afState.form, [opts.id, name]),
        placeholder: _.get(schema, 'autoform.placeholder'),
        rows: _.get(schema, 'autoform.rows') || 6,
      })
    )},
    password: function(){return m('.field',
      attr.label(name, schema), m('input.input', {
        name: !schema.exclude ? name : '',
        required: !schema.optional, type: 'password',
        placeholder: _.get(schema, 'autoform.placeholder')
      })
    )},
    select: function(){return m('.field.is-expanded',
      attr.label(name, schema),
      m('.select.is-fullwidth', m('select',
        {
          name: !schema.exclude ? name : '',
          required: !schema.optional,
          value: _.get(afState.form, [opts.id, name])
        },
        m('option', {value: ''}, '-'),
        schema.autoform.options(name, afState.form[opts.id])
        .map(function(i){return m('option', {
          value: i.value,
          selected: !!_.get(afState.form, [opts.id, name])
        }, i.label)})
      )),
      m('p.help', _.get(schema, 'autoform.help'))
    )},
    standard: function(){return ors([
      schema.type === Object && m('.box',
        attr.label(name, schema),
        _.map(opts.schema, function(val, key){
          return _.merge(val, {name: key})
        }).filter(function(i){
          function getLen(str){return _.size(_.split(str, '.'))};
          return _.every([
            _.includes(i.name, normal(name)+'.'),
            getLen(name)+1 === getLen(i.name)
          ])
        }).map(function(i){
          var childSchema = opts.schema[normal(i.name)];
          return inputTypes(
            name+'.'+_.last(i.name.split('.')), childSchema
          )[_.get(childSchema, 'autoform.type') || 'standard']()
        }),
        m('p.help', _.get(schema, 'autoform.help'))
      ),

      schema.type === Array && m('.box',
        attr.label(name, schema),
        m('tags',
          m('.tag.is-success', attr.arrLen(name, 'inc'), 'Add+'),
          m('.tag.is-warning', attr.arrLen(name, 'dec'), 'Rem-'),
          m('.tag', afState.arrLen[name]),
        ),
        _.range(afState.arrLen[name]).map(function(i){
          var childSchema = opts.schema[normal(name)+'.$']
          return inputTypes(name+'.'+i, childSchema)
          [_.get(childSchema, 'autoform.type') || 'standard']()
        }),
        m('p.help', _.get(schema, 'autoform.help'))
      ),

      m('.field',
        attr.label(name, schema),
        m('.control', m('input.input', {
          step: 'any', name: !schema.exclude ? name : '',
          placeholder: _.get(schema, 'autoform.placeholder'),
          value: ors([
            schema.autoValue &&
            schema.autoValue(name, afState.form[opts.id], opts),
            schema.type === Date &&
            dateValue(_.get(afState.form, [opts.id, name])),
            _.get(afState.form, [opts.id, name])
          ]),
          required: !schema.optional, pattern: schema.regExp,
          min: schema.minMax && schema.minMax(name, afState.form[opts.id])[0],
          max: schema.minMax && schema.minMax(name, afState.form[opts.id])[1],
          onchange: schema.autoRedraw && function(){},
          type: _.get(
            [[Date, 'date'], [String, 'text'], [Number, 'number']]
            .filter(function(i){return i[0] === schema.type})[0], '1'
          ),
        })),
        m('p.help', _.get(schema, 'autoform.help'))
      )
    ])},
  }}

  return m('form', attr.form,
    _.map(opts.schema, function(val, key){
      return !_.includes(key, '.') && inputTypes(key, val)[
        _.get(val, 'autoform.type') || 'standard'
      ]()
    }),
    m('.row', m('button.button',
      _.assign({type: 'submit', class: 'is-info'}, opts.submit),
      (opts.submit && opts.submit.value) || 'Submit'
    ))
  )
}}}

/*global moment numeral _ m Dexie selects io*/

var
withThis = (obj, cb) => cb(obj),
ors = array => array.find(Boolean),
ands = array =>
  array.reduce((res, inc) => res && inc, true)
  && array[array.length-1],

randomId = () =>
  [1, 1].map(() =>
    Math.random().toString(36).slice(2)
  ).join(''),

hari = (timestamp, hour) =>
  timestamp && moment(timestamp)
  .format('Do MMMM YYYY'+(hour ? ', hh:mm' : '')),

daysDifference = (start, end) =>
  Math.round((end - start) / (1000 * 60 * 60 * 24)),
  // miliseconds, seconds, minutes, hours

startOfTheDay = timestamp => +moment(
  moment(timestamp).format('YYYY-MM-DD')
),

rupiah = (num) =>
  'Rp '+numeral(num || 0).format('0,0'),

tds = (array) =>
  array.map(i => m('td', i)),

paginate = (array, name, length) => array.slice(
  _.get(state, ['pagination', name]) * length,
  _.get(state, ['pagination', name]) * length + length,
),

insertBoth = (collName, doc) => withThis(
  _.merge(doc, {_id: randomId(), updated: _.now()}),
  obj => [
    db[collName].put(obj),
    dbCall({
      method: 'insertOne', collection: collName, document: obj
    }, () => ''),
    io().emit('datachange', collName, doc)
  ]
),

updateBoth = (collName, _id, doc) => withThis(
  _.merge(doc, {_id: _id, updated: _.now()}),
  obj => [
    db[collName].put(obj),
    dbCall({
      method: 'updateOne', collection: collName,
      document: obj, _id: _id
    }, () => ''),
    io().emit('datachange', collName, doc)
  ]
),

makeModal = name => m('.modal',
  {class: state[name] && 'is-active'},
  m('.modal-background'),
  m('.modal-content', state[name]),
  m('.modal-close.is-large', {onclick: () =>
    [state[name] = null, m.redraw()]
  })
),

makeReport = (name, action) => m('.box',
  m('h4', 'Unduh Laporan '+name),
  m('form.field-body', {onsubmit: action},
    m('.field', m('.control.is-expanded',
      m('input.input', {type: 'date', name: 'start'})
    )),
    m('.field', m('.control.is-expanded',
      m('input.input', {type: 'date', name: 'end'})
    )),
    m('input.button.is-primary',
      {type: 'submit', value: 'Unduh'}
    )
  )
),

tarifInap = (masuk, keluar, tarif) =>
  (daysDifference(keluar - masuk) || 1) * 1000 * +tarif,

tarifIGD = 45000, tarifKartu = 8000,

dbCall = (body, action) =>
  io().emit('dbCall', body, action),

collNames = ['patients', 'goods', 'references', 'users', 'queue'],

state = {route: 'dashboard'}, comp = {},

menus = {
  emergency: {full: 'IGD', icon: 'heartbeat'},
  registration: {
    full: 'Pendaftaran', icon: 'address-book',
    children: {
      icd: {full: 'Kodifikasi'},
      queue: {full: 'Antrian'}
    }
  },
  outpatient: {full: 'Rawat Jalan', icon: 'male'},
  inpatient: {
    full: 'Rawat Inap', icon: 'bed',
    children: {
      beds: {full: 'Daftar Kamar'},
      surgery: {full: 'Antrian Bedah'}
    }
  },
  cashier: {full: 'Kasir', icon: 'cash-register'},
  storage: {
    full: 'Gudang', icon: 'cubes',
    children: {
      transfer: {full: 'Amprah'}
    }
  },
  pharmacy: {full: 'Apotik', icon: 'flask'},
  management: {
    full: 'Manajemen', icon: 'users',
    children: {
      users: {full: 'Pengguna'},
      references: {full: 'Referensi'}
    }
  }
},

db = new Dexie('simrs')

db.version(1).stores(collNames.reduce((res, inc) =>
  _.merge(res, {[inc]: '_id'})
, {})),

getDifference = name =>
  db[name].toArray(array =>
    dbCall({
      method: 'getDifference', collection: name,
      clientColl: array.map(i =>
        _.pick(i, ['_id', 'updated'])
      )
    }, res => [
      db[name].bulkPut(res),
      state.lastSync = +moment(),
      state.loading = false,
      m.redraw()
    ])
  ),

getDifferences = () =>
  collNames.map(name => getDifference(name))

/*global _ state*/

var
selects = name => _.reduce(
  {
    alias: ['tn', 'ny', 'nn', 'an', 'by'],
    kelamin: ['laki-laki', 'perempuan'],
    agama: ['islam', 'katolik', 'protestan', 'budha', 'hindu', 'konghuchu'],
    nikah: ['nikah', 'belum_nikah', 'janda', 'duda'],
    pendidikan: ['sd', 'smp', 'sma', 'diploma', 's1', 's2', 's3', 'tidak_sekolah'],
    darah: ['a', 'b', 'ab', 'o'],
    pekerjaan: ['pns', 'swasta', 'wiraswasta', 'tni', 'polri', 'pensiunan', 'lainnya'],
    cara_bayar: ['umum', 'bpjs', 'asuransi'],
    kodepoli:     ['int',            'ana',  'obg',   'bed',   'gig'],
    klinik:       ['penyakit_dalam', 'anak', 'obgyn', 'bedah', 'gigi', 'umum'],
    tarif_klinik: [ 95,               95,     95,      95,      95,     45],
    rujukan: ['datang_sendiri', 'rs_lain', 'puskesmas', 'faskes_lainnya'],
    keluar: ['pulang', 'rujuk', 'inap'],
    jenis_barang: ['Obat', 'BHP', 'Logistik'],
    satuan: ['botol', 'vial', 'ampul', 'pcs', 'sachet', 'tube', 'supp', 'tablet', 'minidose', 'pot', 'turbuhaler', 'kaplet', 'kapsul', 'bag', 'pen', 'rectal', 'flash', 'cream', 'nebu', 'galon', 'lembar', 'roll', 'liter', 'cup', 'pasang', 'bungkus', 'box', 'syringe'],
    boolean: ['ya', 'tidak'],
    peranan: ['petugas', 'perawat', 'dokter', 'admin'],
    bidang: ['pendaftaran', 'kasir', 'farmasi', 'apotik', 'manajemen'],
    kelas_bed: ['VIP', 'I', 'II', 'III'],
    tarif_bed: [ 350,   200, 150,  100],
    keaktifan: ['aktif', 'non-aktif']
  }, (res, inc, key) =>
    _.merge(res, {[key]: () => _.map(inc, (val, key) =>
        ({label: _.startCase(val), value: key+1})
      )})
  , {}
)[name],

look = (category, value) => _.get(
  selects(category)().filter((i, j) =>
    j+1 === value
  )[0], 'label'
) || '-',

lookGoods = _id =>
  _id && state.goodsList
  .filter(i => i._id === _id)[0],

lookReferences = _id =>
  _id && state.references
  .filter(i => i._id === _id)[0],

lookUser = _id =>
  _id && state.userList
  .filter(i => i._id === _id)[0].nama
/*global ors _ state selects randomId*/

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
        _.sortBy(state.references.map(i =>
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

  admisi: {
    kelas_bed: {type: Number, autoform: {
      type: 'select', options: selects('kelas_bed')
    }},
    kode_bed: {type: String}
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

/*global pdfMake hari _ ors lookUser hari rupiah look lookReferences moment state lookGoods tarifInap withThis beds*/

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
    }).download('kartu_peserta_'+identitas.no_mr)
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
          rawatLength === 1 ? tarifKartu : 0,
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
          !rawat.klinik && !rawat.idinap ? [['Layanan IGD', rupiah(tarifIGD)]] : [],
          tindakans ? tindakans.map(i => [i[0], rupiah(i[1])]) : [],
          obats ? obats.map(i => [i[0], rupiah(i[1])]) : [],
          rawat.observasi ? [['Biaya inap', rupiah(tarifInap(
            rawat.tanggal_masuk, rawat.keluar,
            beds[rawat.bed.kelas].tarif
          )
          )]] : [],
          observasi ? observasi.map(i => [i[0], rupiah(i[1])]) : []
        )}},
        '\nTotal Biaya '+rupiah(_.sum([
          !rawat.klinik && !rawat.bed && tarifIGD,
          tindakans && tindakans.reduce((res, inc) => res + inc[1], 0),
          obats && obats.reduce((res, inc) => res + inc[1], 0),
          rawat.observasi && _.sum([
            tarifInap(
              rawat.tanggal_masuk, rawat.keluar,
              beds[rawat.bed.kelas].tarif
            ),
            _.sum(observasi.map(j => j[1]))
          ])
        ])),
        {text: '\nP. Kuras, '+hari(_.now())+'\n\n\n\n\nPetugas', alignment: 'right'}
      ]}).download('bayar_konsultasi_'+identitas.no_mr)
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
            'Suhu: '+(_.get(rawat, 'soapPerawat.fisik.suhu') || '-')+' C', 'LILA: '+(_.get(rawat, 'soapPerawat.fisik.lila') || '-')
          ], [
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
    ]}).download('soap_'+identitas.no_mr)
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
    ]}).download('salinan_resep_'+identitas.no_mr)
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

/*global _ comp m state db hari autoForm schemas insertBoth updateBoth randomId tds withThis ands startOfTheDay moment*/

_.assign(comp, {
  registration: () => state.login.bidang !== 1 ?
  m('p', 'Hanya untuk user pendaftaran') : m('.content',
    m('h3', 'Pencarian Pasien'),
    m('.control.is-expanded', m('input.input.is-fullwidth', {
      type: 'text', placeholder: 'Cari dengan nama lengkap atau No. MR',
      onkeypress: e =>
        db.patients.filter(i => _.includes(
          _.lowerCase(i.identitas.nama_lengkap)+i.identitas.no_mr,
          e.target.value
        )).toArray(array => [
          state.searchPatients = array,
          m.redraw()
        ])
    })),
    m('table.table',
      m('thead', m('tr',
        ['Kunjungan Terakhir', 'No. MR', 'Nama lengkap', 'Tanggal lahir', 'Tempat lahir']
        .map(i => m('th', i))
      )),
      m('tbody', (state.searchPatients || []).map(i => m('tr',
        {ondblclick: () => _.assign(state, {
          route: 'onePatient', onePatient: i
        })},
        tds([
          hari(_.get(_.last(([]).concat(i.rawatJalan || [], i.emergency || [])), 'tanggal')),
          i.identitas.no_mr, i.identitas.nama_lengkap,
          hari(i.identitas.tanggal_lahir), i.identitas.tempat_lahir
        ])
      )))
    ),
    m('.button.is-primary',
      {onclick: () => state.route = 'newPatient'},
      m('span.icon', m('i.fas.fa-user-plus')),
      m('span', 'Pasien baru')
    )
  ),

  newPatient: () => m('.content',
    m('h3', 'Pendaftaran Pasien Baru'),
    m(autoForm({
      id: 'newPatient', schema: schemas.identitas,
      confirmMessage: 'Yakin ingin menambahkan pasien BARU?',
      action: doc => withThis(
        {identitas: doc, _id: randomId()}, obj => [
          insertBoth('patients', obj),
          doc.no_antrian && db.queue.toArray(arr => withThis(
            arr.find(i => i.no_antrian === doc.no_antrian),
            obj => updateBoth('queue', obj._id, _.merge(obj, {done: true}))
          )),
          _.assign(state, {route: 'onePatient', onePatient: obj})
        ]
      ),
    }))
  ),

  updatePatient: () => m('.content',
    m('h3', 'Update identitas pasien'),
    m(autoForm({
      id: 'updatePatient', schema: schemas.identitas,
      doc: state.onePatient.identitas,
      action: doc => [
        updateBoth(
          'patients', state.onePatient._id,
          _.assign(state.onePatient, {identitas: doc})
        ), state.route = 'onePatient', m.redraw()
      ]
    }))
  ),

  poliVisit: () => m('.content',
    m('h3', 'Form Pendaftaran Poli'),
    m('.box', m(autoForm({
      id: 'poliVisit', autoReset: true,
      schema: schemas.rawatJalan,
      action: doc => db.patients.filter(i =>
        i.rawatJalan && i.rawatJalan.filter(j => ands([
          j.klinik === 1,
          j.tanggal > startOfTheDay(+moment())
        ])).length
      ).toArray(array => [
        updateBoth('patients', state.onePatient._id, _.assign(state.onePatient, {
          rawatJalan: (state.onePatient.rawatJalan || []).concat([
            _.merge(doc, {antrian: array.length+1})
          ])
        })),
        doc.no_antrian && db.queue.toArray(arr => withThis(
          arr.find(i => i.no_antrian === doc.no_antrian),
          obj => updateBoth('queue', obj._id, _.merge(obj, {done: true}))
        )),
        state.route = 'onePatient',
        m.redraw()
      ])
    })))
  )
})

/*global _ m comp state db hari look moment makePdf ors ands state autoForm schemas updateBoth state randomId withThis makeModal*/

_.assign(comp, {
  onePatient: () => withThis(
    state.onePatient.identitas,
    id => m('.content',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.goods.toArray(array => state.goodsList = array),
        db.users.toArray(array => state.userList = array)
      ]},
      m('h3', 'Rekam Medik Pasien'),
      m('table.table', _.chunk([
        ['No. MR', id.no_mr],
        ['Nama Lengkap', id.nama_lengkap],
        ['Tanggal lahir', hari(id.tanggal_lahir)],
        ['Tempat lahir', id.tempat_lahir],
        ['Jenis kelamin', look('kelamin', id.kelamin)],
        ['Agama', look('agama', id.agama)],
        ['Status nikah', look('nikah', id.nikah)],
        ['Pendidikan terakhir', look('pendidikan', id.pendidikan)],
        ['Golongan Darah', look('darah', id.darah)],
        ['Pekerjaan', look('pekerjaan', id.pekerjaan)],
        ['Tempat tinggal', id.tempat_tinggal],
        ['Umur', moment().diff(id.tanggal_lahir, 'years')+' tahun'],
        ['Nama Bapak', id.keluarga.ayah],
        ['Nama Ibu', id.keluarga.ibu],
        ['Nama Suami/Istri', id.keluarga.pasangan],
        ['No. Handphone', id.kontak]
      ], 4).map(i => m('tr', i.map(j =>
        [m('th', j[0]), m('td', j[1])]
      )))),
      m('p.buttons',
        [
          {
            label: 'Cetak kartu', icon: 'id-card', color: 'info',
            click: () => makePdf.card(id)
          },
          {
            label: 'General consent', icon: 'file-contract', color: 'info',
            click: () => makePdf.consent(id)
          },
          {
            label: 'Update pasien', icon: 'edit', color: 'warning',
            click: () => state.route = 'updatePatient'
          },
          {
            label: 'Riwayat SOAP', icon: 'bars', color: 'info',
            click: () => state.modalRekapSoap = m('.box',
              m('h3', 'Rekap SOAP Pasien'),
              m('p.help', 'Berurut kronologis'),
              [
                ...(state.onePatient.rawatJalan || []),
                ...(state.onePatient.emergency || []),
              ].map(i => m('table.table',
                i.soapPerawat && i.soapDokter && [
                  ['Tanggal Kunjungan', hari(i.tanggal, true)],
                  ['Layanan', i.klinik ? look('klinik', i.klinik) : 'Emergency'],
                  ['Anamnesa Perawat', i.soapPerawat.anamnesa],
                  ['Diagnosa Dokter', i.soapDokter.diagnosa.map(i => i.text).join(', ')]
                ].map(j => m('tr', m('th', j[0]), m('td', j[1])))
              ))
            )
          }
        ]
        .map(i => m('.button.is-'+i.color,
          {onclick: i.click},
          m('span.icon', m('i.fas.fa-'+i.icon)),
          m('span', i.label)
        ))
      ),
      makeModal('modalRekapSoap'),
      m('.tabs.is-boxed', m('ul',
        {style: 'margin-left: 0%'},
        _.map({
          outpatient: ['Riwayat Rawat Jalan', 'walking'],
          emergency: ['Riwayat UGD', 'ambulance'],
          inpatient: ['Riwayat Rawat Inap', 'bed']
        }, (val, key) => m('li',
          {class: ors([
            key === state.onePatientTab,
            ands([
              !state.onePatientTab,
              _.get(state, 'login.poliklinik'),
              key === 'outpatient'
            ])
          ]) && 'is-active'},
          m('a',
            {onclick: () => [state.onePatientTab = key, m.redraw()]},
            m('span.icon', m('i.fas.fa-'+val[1])),
            m('span', val[0])
          )
        ))
      )),
      m('div', ({
        outpatient: comp.outPatientHistory(),
        emergency: comp.emergencyHistory(),
        inpatient: comp.inpatientHistory()
      })[state.onePatientTab || ors([
        _.get(state, 'login.poliklinik') && 'outpatient'
      ])])
    )
  ),

  formSoap: () => m('.content',
    {onupdate: () =>
      db.goods.toArray(array => [
        state.goodsList = array,
        state.drugList = array.filter(i =>
          i.batch.reduce((j, k) =>
            j + (k.stok.apotik || 0)
          , 0) > (_.get(i, 'stok_minimum.apotik') || 0)
        )
     ])
    },
    m('h3', 'Form SOAP'),
    m('div', {oncreate: () => [
      db.references.filter(i =>
        _.every([
          i[0] === 'rawatJalan',
          i[1] === _.snakeCase(look(
            'klinik', state.login.poliklinik
          ))
        ])
      ).toArray(array =>
        state.references = array
      ), state.spm = _.now()
    ]}),
    m(autoForm({
      id: 'soapMedis', autoReset: true,
      confirmMessage: 'Yakin untuk menyimpan SOAP?',
      schema: ors([
        state.login.peranan === 2 && schemas.soapPerawat,
        state.login.peranan === 3 && ors([
          state.oneInap && _.omit(schemas.soapDokter, 'keluar'),
          schemas.soapDokter
        ])
      ]),
      action: doc => withThis(
        state.oneRawat &&
        (state.oneRawat.klinik ? 'rawatJalan' : 'emergency'),
        facility => [
          facility && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {[facility]: state.onePatient[facility].map(i =>
              i.idrawat === state.oneRawat.idrawat ?
              _.merge(state.oneRawat, ors([
                state.login.peranan === 2 && {soapPerawat: doc},
                state.login.peranan === 3 && {soapDokter: doc}
              ])) : i
            )}
          )),
          state.oneInap && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {rawatInap:
              state.onePatient.rawatInap.map(i =>
                i.idinap === state.oneInap.idinap ?
                _.assign(state.oneInap, {observasi:
                  state.oneInap.observasi.concat([_.merge(
                    doc, {tanggal: _.now(), idobservasi: randomId()}
                  )])
                }) : i
              )
            }
          )),
          _.assign(state, {
            route: 'onePatient', oneRawat: null, oneInap: null
          }),
          m.redraw()
        ]
      )
    }))
  ),
})

/*global _ m comp db state ors hari look lookUser lookReferences updateBoth makeModal withThis*/

_.assign(comp, {
  icd: () => state.login.bidang !== 1 ?
  m('p', 'Hanya untuk bidang Pendaftaran/ICD') : m('.content',
    m('h3', 'Kodifikasi Diagnosa ICD 10 & ICD 9-CM'),
    m('table.table',
      m('thead', m('tr',
        ['Nama pasien', 'Tanggal kunjungan', 'Layanan', 'Perawat', 'Dokter', 'ICD10', 'ICD9CM']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          db.patients.toArray(array =>
            state.codifications = _.compact(array.flatMap(a =>
              ([]).concat(
                a.rawatJalan || [], a.emergency || [],
                a.rawatInap ? a.rawatInap.flatMap(b =>
                  b.observasi ? b.observasi.map(c =>
                    c.dokter && {idinap: b.idinap, soapDokter: c}
                  ) : []
                ) : []
              ).flatMap(b =>
                ([]).concat(
                  _.get(b, 'soapDokter.diagnosa') || [],
                  _.get(b, 'soapDokter.tindakan') || []
                ).filter(c => !c.code).length &&
                _.merge({}, a, b)
              )
            ))
          ),
          db.references.toArray(array =>
            state.references = array
          )
        ]},
        (state.codifications || []).map(a => m('tr',
          m('td', a.identitas.nama_lengkap), m('td', hari(a.tanggal)),
          m('td', ors([
            a.klinik && look('klinik', a.klinik),
            a.idrawat && 'IGD', 'Rawat Inap'
          ])),
          m('td',
            lookUser(_.get(a, 'soapPerawat.perawat'))),
            m('td', lookUser(a.soapDokter.dokter)
          ),
          m('td', m('.button',
            {onclick: () =>
              state.modalICD10 = m('.box',
                m('h4', 'Form kodifikasi diagnosa ICD10'),
                m('form',
                  {onsubmit: e => withThis(
                    a.idrawat && a.klinik ? 'rawatJalan' : 'emergency',
                    facility => [
                      e.preventDefault(),
                      a.idrawat ? updateBoth('patients', a._id,
                        _.assign({
                          _id: a._id, identitas: a.identitas,
                          rawatJalan: a.rawatJalan || [],
                          emergency: a.emergency || [],
                          rawatInap: a.rawatInap || []
                        }, {[facility]: a[facility].map(b =>
                          b.idrawat === a.idrawat ? _.assign(b, {soapDokter: _.assign(
                            b.soapDokter, {diagnosa: b.soapDokter.diagnosa.map((c, d) =>
                              ({text: c.text, code: _.compact(_.map(e.target, f =>
                                f.name && f.value
                              ))[d]})
                            )}
                          )}) : b
                        )})
                      ) : updateBoth('patients', a._id, {
                        _id: a._id, identitas: a.identitas,
                        rawatJalan: a.rawatJalan || [],
                        emergency: a.emergency || [],
                        rawatInap : a.rawatInap.map(b =>
                          b.idinap === a.idinap ?
                          _.assign(b, {observasi: b.observasi.map(c =>
                            c.idobservasi === a.soapDokter.idobservasi ?
                            _.assign(c, {diagnosa: c.diagnosa.map((d, f) =>
                              ({text: d.text, code: _.compact(_.map(e.target, g =>
                                g.name && g.value
                              ))[f]})
                            )}) : c
                          )}) : b
                        )
                      }),
                      state.modalICD10 = null,
                      m.redraw()
                    ]
                  )},
                  m('table.table',
                    m('thead', m('tr', m('th', 'Teks'), m('th', 'Kode'))),
                    m('tbody', a.soapDokter.diagnosa.map((b, c) => m('tr',
                      m('td', b.text), m('td', m('input.input', {
                        type: 'text', name: c, value: b.code
                      }))
                    )))
                  ),
                  m('input.button.is-primary', {type: 'submit', value: 'Submit'})
                )
              )
            },
            _.every(
              a.soapDokter.diagnosa.map(b => b.code)
            ) ? 'Selesai' : 'Belum'
          )),
          m('td', a.soapDokter.tindakan && m('.button',
            {onclick: () =>
              state.modalICD9 = m('.box',
                m('h4', 'Form kodifikasi tindakan ICD9'),
                m('form',
                  {onsubmit: e => withThis(
                    a.idrawat && a.klinik ? 'rawatJalan' : 'emergency',
                    facility => [
                      e.preventDefault(),
                      a.idrawat ? updateBoth('patients', a._id,
                        _.assign({
                          _id: a._id, identitas: a.identitas,
                          rawatJalan: a.rawatJalan || [],
                          emergency: a.emergency || [],
                          rawatInap: a.rawatInap || []
                        }, {[facility]: a[facility].map(b =>
                          b.idrawat === a.idrawat ? _.assign(b, {soapDokter: _.assign(
                            b.soapDokter, {tindakan: b.soapDokter.tindakan.map((c, d) =>
                              ({text: c.idtindakan, code: _.compact(_.map(e.target, f =>
                                f.name && f.value
                              ))[d]})
                            )}
                          )}) : b
                        )})
                      ) : updateBoth('patients', a._id, {
                        _id: a._id, identitas: a.identitas,
                        rawatJalan: a.rawatJalan || [],
                        emergency: a.emergency || [],
                        rawatInap : a.rawatInap.map(b =>
                          b.idinap === a.idinap ?
                          _.assign(b, {observasi: b.observasi.map(c =>
                            c.idobservasi === a.soapDokter.idobservasi ?
                            _.assign(c, {tindakan: c.tindakan.map((d, f) =>
                              ({text: d.text, code: _.compact(_.map(e.target, g =>
                                g.name && g.value
                              ))[f]})
                            )}) : c
                          )}) : b
                        )
                      }),
                      state.modalICD9 = null,
                      m.redraw()
                    ]
                  )},
                  m('table.table',
                    m('thead', m('tr', m('th', 'Teks'), m('th', 'Kode'))),
                    m('tbody', a.soapDokter.tindakan.map((b, c) => m('tr',
                      m('td', lookReferences(b.idtindakan).nama),
                      m('td', m('input.input', {
                        type: 'text', name: c, value: b.code
                      }))
                    )))
                  ),
                  m('input.button.is-primary', {type: 'submit', value: 'Submit'})
                )
              )
            },
            _.every(a.soapDokter.tindakan.map(b => b.code)) ? 'Selesai' : 'Belum'
          ))
        ))
      )
    ),
    makeModal('modalICD10'),
    makeModal('modalICD9')
  )
})
/*global _ m comp look state db ands hari state ors makePdf lookUser updateBoth makeReport makeModal withThis tds dbCall moment*/

_.assign(comp, {
  outpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    // state.login.peranan === 4 &&
    makeReport('Kunjungan Poliklinik', e => withThis(
      ({
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      }),
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Kunjungan Poliklinik',
          [['Tanggal', 'Poliklinik', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter']]
          .concat(_.compact(
            array.flatMap(pasien =>
              pasien.rawatJalan &&
              pasien.rawatJalan.map(rawat =>
                _.every([
                  rawat.soapDokter,
                  rawat.tanggal > date.start &&
                  rawat.tanggal < date.end
                ]) && [
                  hari(rawat.tanggal),
                  look('klinik', rawat.klinik),
                  pasien.identitas.no_mr.toString(),
                  pasien.identitas.nama_lengkap,
                  lookUser(rawat.soapPerawat.perawat),
                  lookUser(rawat.soapDokter.dokter)
                ]
              )
            ).sort((a, b) => a.tanggal - b.tanggal)
          ))
        ))
      ]
    )),
    m('h3', 'Antrian pasien poliklinik '+look('klinik', state.login.poliklinik)),
    m('table.table',
      m('thead', m('tr',
        ['Kunjungan Terakhir', 'No. MR', 'Nama lengkap', 'Tanggal lahir', 'Tempat lahir']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () =>
          db.patients.toArray(array =>
            state.clinicQueue = array.filter(i => withThis(
              _.last(i.rawatJalan),
              lastOne => lastOne && ands([
                lastOne.klinik === state.login.poliklinik,
                !ands([lastOne.soapPerawat, lastOne.soapDokter])
              ])
            ))
          )
        },
        (state.clinicQueue || [])
        .sort((a, b) => withThis(
          obj => _.last(obj.rawatJalan).tanggal,
          lastDate => lastDate(a) - lastDate(b)
        ))
        .map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i
          })},
          tds([
            hari(_.last(i.rawatJalan).tanggal),
            i.identitas.no_mr, i.identitas.nama_lengkap,
            hari(i.identitas.tanggal_lahir),
            i.identitas.tempat_lahir
          ])
        ))
      )
    )
  ),

  outPatientHistory: () => m('.content',
    m('table.table',
      {onupdate: () => dbCall({
        method: 'find', collection: 'patients',
        _id: state.onePatient._id
      }, (res) => db.patients.put(res))},
      m('thead', m('tr',
        ['Tanggal berobat', 'Poliklinik', 'Cara bayar', 'Perawat', 'Dokter']
        .map(i => m('th', i)),
        state.login.peranan === 4 && m('th', 'Hapus')
      )),
      m('tbody',
        (_.get(state.onePatient, 'rawatJalan') || []).map(i => m('tr',
          {ondblclick: () => [
            state.modalVisit = _.includes([2, 3, 4], state.login.peranan) &&
            ors([i.cara_bayar !== 1, i.bayar_pendaftaran]) && m('.box',
              m('h3', 'Rincian Kunjungan'),
              m('table.table',
                m('tr', m('th', 'Tanggal'), m('td', hari(i.tanggal, true))),
                m('tr', m('th', 'Poliklinik'), m('td', look('klinik', i.klinik))),
                m('tr', m('th', 'Cara bayar'), m('td', look('cara_bayar', i.cara_bayar))),
                i.soapPerawat && [
                  m('tr', m('th', 'Anamnesa Perawat'), m('td', i.soapPerawat.anamnesa)),
                  i.soapPerawat.tekanan_darah &&
                  m('tr', m('th', 'Tekanan darah'), m('td', i.soapPerawat.tekanan_darah))
                ],
                i.soapDokter && [
                  m('tr', m('th', 'Anamnesa Dokter'), m('td', i.soapDokter.anamnesa)),
                  _.map(i.soapDokter.diagnosa, (j, k) =>
                    m('tr', m('th', 'Diagnosa '+k), m('td', j.text+' / ICD X: '+(j.icd10 || '?')))
                  )
                ]
              ),
              m('p.buttons',
                ands([
                  state.login.peranan !== 1,
                  ors([
                    state.login.peranan === 2 && !i.soapPerawat,
                    state.login.peranan === 3 && !i.soapDokter,
                  ]),
                  m('.button.is-success',
                    {onclick: () =>_.assign(state, {
                      route: 'formSoap', oneRawat: i, modalVisit: null
                    })},
                    m('span.icon', m('i.fas.fa-user-md')),
                    m('span',
                      state.login.peranan === 3 ?
                      'Soap Dokter' : 'Soap Perawat'
                    )
                  ),
                ]),
                m('.button.is-info',
                  {onclick: () => makePdf.soap(state.onePatient.identitas, i)},
                  m('span.icon', m('i.fas.fa-print')),
                  m('span', 'Cetak SOAP')
                )
              )
            )
          ]},
          tds([
            hari(i.tanggal),
            look('klinik', i.klinik),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
          state.login.peranan === 4 && m('td', m('.button.is-danger', {
            ondblclick: (e) => [
              e.stopPropagation(),
              updateBoth('patients', state.onePatient._id, _.assign(
                state.onePatient, {rawatJalan:
                  state.onePatient.rawatJalan.filter(j =>
                    j.idrawat !== i.idrawat
                  )
                }
              ))
            ]
          }, 'Hapus'))
        ))
      )
    ),
    makeModal('modalVisit'),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'poliVisit'},
      m('span.icon', m('i.fas.fa-file-invoice')),
      m('span', 'Kunjungi Rawat Jalan')
    )
  )
})

/*global _ m comp db state ands updateBoth randomId look hari makeModal lookUser lookReferences lookGoods selects makePdf makeReport withThis tds rupiah autoForm moment*/

_.assign(comp, {
  inpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',

    // state.login.peranan === 4 &&
    makeReport('Kunjungan Rawat Inap', e => withThis(
      {
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      },
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Kunjungan Rawat Inap',
          [['Tanggal', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter']]
          .concat(_.compact(
            array.flatMap(pasien =>
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
            ).sort((a, b) => a.tanggal - b.tanggal)
          ))
        ))
      ]
    )),

    m('h3', 'Daftar Admisi Rawat Inap'),
    m('table.table',
      {onupdate: () =>
        db.patients.toArray(array =>
          state.admissionList = _.compact(array.flatMap(i =>
            ([]).concat(i.rawatJalan || [], i.emergency || [])
            .flatMap(j => ands([
              _.get(j, 'soapDokter.keluar') === 3,
              (i.rawatInap || []).filter(k =>
                k.idrawat === j.idrawat
              ).length === 0,
              {pasien: i, inap: j}
            ]))
          ))
        )
      },
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Tanggal admisi']
        .map(i => m('th', i))
      )),
      m('tbody', (state.admissionList || [])
      .reverse().map(i => m('tr',
        {ondblclick: () => [
          state.admissionModal = m('.box',
            m('h4', 'Inapkan pasien'),
            m('table.table',
              [
                ['Nama Lengkap', i.pasien.identitas.no_mr],
                ['Cara bayar', look('cara_bayar', i.inap.cara_bayar)],
                ['Anamnesa Perawat', _.get(i, 'inap.soapPerawat.anamnesa')],
                ['Anamnesa Dokter', _.get(i, 'inap.soapDokter.anamnesa')],
              ].map(j => m('tr', m('th', j[0]), m('td', j[1]))),
            ),
            m(autoForm({
              id: 'formBed', schema: schemas.beds,
              action: (doc) => [
                updateBoth(
                  'patients', i.pasien._id, _.assign(i.pasien, {
                    rawatInap: (i.rawatInap || []).concat([{
                      tanggal_masuk: _.now(), dokter: i.inap.soapDokter.dokter,
                      observasi: [], idinap: randomId(), idrawat: i.inap.idrawat,
                      cara_bayar: i.inap.cara_bayar, bed: doc
                    }])
                  })
                ),
                state.admissionModal = null,
                m.redraw()
              ]
            }))
          ), m.redraw()
        ]},
        tds([
          i.pasien.identitas.no_mr,
          i.pasien.identitas.nama_lengkap,
          hari(i.inap.tanggal)
        ])
      )))
    ),
    makeModal('admissionModal'),
    m('br'),

    m('h3', 'Daftar Pasien Menginap'),
    m('table.table',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Kelas/Kamar/Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.inpatientList &&
        state.inpatientList.map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i,
            onePatientTab: 'inpatient'
          })},
          tds([
            i.identitas.no_mr,
            i.identitas.nama_lengkap,
            withThis(
              _.get(_.last(i.rawatInap), 'bed'),
              bed => [
                _.upperCase(bed.kelas),
                _.startCase(bed.kamar),
                bed.nomor
              ].join('/')
            )
          ])
        ))
      )
    )
  ),

  inpatientHistory: () => m('.content',
    m('table.table',
      m('thead', m('tr',
        ['Tanggal masuk', 'Kelas/Kamar/Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.onePatient.rawatInap || []).map(i => m('tr',
          {ondblclick: () =>
            state.modalObservasi = _.includes([2, 3], state.login.peranan) && m('.box',
              m('h3', 'Riwayat Observasi'),
              i.observasi.length ? m('p.is-italic.has-text-danger', 'klik-ganda pada salah satu observasi untuk melihat rincian') : '',
              m('table.table',
                m('thead', m('tr',
                  ['Waktu', 'Anamnesa', 'Petugas']
                  .map(j => m('th', j))
                )),
                m('tbody', i.observasi.map(j => m('tr',
                  {ondblclick: () => [
                    state.modalObservasi = null,
                    state.modalSoap = m('.box',
                      m('h4', 'Rincian SOAP'),
                      m('table.table',
                        m('tr', m('th', 'Waktu observasi'), m('td', hari(j.tanggal, true))),
                        m('tr', m('th', 'Anamnesa'), m('td', j.anamnesa)),
                        j.diagnosa && m('tr', m('th', 'Diagnosa'), m('td',
                          j.diagnosa.map(k => k.text).join(', ')
                        )),
                        j.tindakan && m('tr', m('th', 'Tindakan'), m('td',
                          j.tindakan.map(k =>
                            lookReferences(k.idtindakan).nama
                          ).join(', ')
                        )),
                        j.obat && m('tr', m('th', 'Obat'), m('td',
                          j.obat.map(k =>
                            lookGoods(k.idbarang).nama+'@'+k.jumlah
                          ).join(', ')
                        )),
                        j.planning && m('tr', m('th', 'Planning'), m('td', j.planning)),
                        m('tr', m('th', 'Tenaga medis'), m('td',
                          lookUser(j.dokter || j.perawat)
                        ))
                      ),
                      m('.button.is-info',
                        {onclick: () => makePdf.soap(
                          state.onePatient.identitas,
                          j.perawat ? {soapPerawat: j} : {soapDokter: j}
                        )},
                        m('span.icon', m('i.fas.fa-print')),
                        m('span', 'Cetak SOAP')
                      )
                    ), m.redraw()
                  ]},
                  tds([
                    hari(j.tanggal), j.anamnesa,
                    lookUser(j.perawat || j.dokter)
                  ])
                )))
              ),
              !i.keluar && m('p.buttons',
                m('.button.is-success',
                  {onclick: () => [
                    _.assign(state, {
                      route: 'formSoap', oneInap: i,
                      modalObservasi: null
                    }), m.redraw()
                  ]},
                  m('span.icon', m('i.fas.fa-user-md')),
                  m('span', 'Tambah observasi')
                ),
                m('.button.is-danger',
                  {ondblclick: () => [
                    updateBoth('patients', state.onePatient._id, _.assign(
                      state.onePatient, {rawatInap:
                        state.onePatient.rawatInap.map(j =>
                          j.idinap === i.idinap ?
                          _.assign(j, {keluar: _.now()}) : j
                        )
                      }
                    )),
                    state.modalObservasi = null,
                    m.redraw()
                  ]},
                  m('span.icon', m('i.fas.fa-door-open')),
                  m('span', 'Pulangkan pasien')
                )
              )
            )
          },
          makeModal('modalSoap'),
          tds([
            hari(i.tanggal_masuk),
            i.bed && [
              _.upperCase(i.bed.kelas),
              _.startCase(i.bed.kamar),
              i.bed.nomor
            ].join(' / ')
          ])
        ))
      )
    ),
    makeModal('modalObservasi')
  ),

  beds: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    m('h3', 'Daftar Kamar'),
    m('table.table',
      m('tr', ['Kelas', 'Kamar', 'No. Bed', 'Penginap'].map(i => m('th', i))),
      state.inpatientList ? _.flattenDepth(
        _.map(beds, (i, j) => _.map(
          i.kamar, (k, l) => _.range(k).map(m => [
            j, l, m+1, _.get(state.inpatientList.find(
              n => n.rawatInap.find(
                o => ands([
                  o.bed.kelas === j,
                  o.bed.kamar === l,
                  o.bed.nomor === m+1
                ])
              )
            ), 'identitas.nama_lengkap')
          ])
        )), 2
      ).map(p => m('tr', p.map(
        q => m('td', _.upperCase(q))
      ))) : m('tr', m('p', 'Buka halaman rawat inap terlebih dahulu'))
    )
  ),
})

var beds = {
  vip: {tarif: 350, kamar: {tulip: 1, bougenvil: 1, sakura: 1}},
  iii: {tarif: 200, kamar: {kenanga: 2, cempaka: 2, claudia: 2, ferbia: 2, yasmin: 2, edelwise: 2}},
  ii: {tarif: 150, kamar: {seroja: 4, mawar: 2, dahlia: 2, lili: 2, zahara: 2, matahari: 4}},
  i: {tarif: 100, kamar: {anggrek: 4, teratai: 8, kertas: 4, melati: 4}}
}

/*global _ comp m db state hari look ands ors lookUser makeModal updateBoth autoForm schemas makePdf makeReport withThis tds moment*/

_.assign(comp, {
  emergency: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    {onupdate: () =>
      db.patients.toArray(array =>
        state.emergencyList = array.filter(i =>
          i.emergency && i.emergency.filter(j =>
            !j.soapDokter
          ).length > 0
        )
      )
    },
    // state.login.peranan === 4 &&
    makeReport('Kunjungan IGD', e => withThis(
      {
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      },
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Kunjungan IGD',
          [['Tanggal', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter']]
          .concat(
            array.flatMap(pasien =>
              pasien.rawatJalan &&
              pasien.rawatJalan.map(rawat =>
                _.every([
                  rawat.soapDokter,
                  rawat.tanggal > date.start && rawat.tanggal < date.end
                ]) && [
                  hari(rawat.tanggal),
                  pasien.identitas.no_mr.toString(),
                  pasien.identitas.nama_lengkap,
                  lookUser(rawat.soapPerawat.perawat),
                  lookUser(rawat.soapDokter.dokter)
                ]
              )
            )
            .sort((a, b) => a.tanggal - b.tanggal)
            .filter(i => i)
          )
        ))
      ]
    )),
    m('h3', 'Unit Gawat Darurat'),
    m('table.table',
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.emergencyList &&
        state.emergencyList.map(i => m('tr',
          {ondblclick: () => [
            _.assign(state, {
              route: 'onePatient', onePatient: i, onePatientTab: 'emergency'
            }),
            m.redraw()
          ]},
          m('td', i.identitas.no_mr),
          m('td', i.identitas.nama_lengkap)
        ))
      )
    )
  ),
  emergencyHistory: () => m('.content',
    m('table.table',
      m('thead', m('tr',
        ['Tanggal berobat', 'Cara bayar', 'Perawat', 'Dokter']
        .map(i => m('th', i))
      )),
      m('tbody',
        (_.get(state, 'onePatient.emergency') || [])
        .map(i => m('tr',
          {onclick: () =>
            state.modalVisit = m('.box',
              m('h4', 'Rincian kunjungan'),
              m('table.table',
                m('tr', m('th', 'Tanggal berobat'), m('td', hari(i.tanggal))),
                m('tr', m('th', 'Cara bayar'), m('td', look('cara_bayar', i.cara_bayar))),
                m('tr', m('th', 'Perawat'), m('td', lookUser(_.get(i, 'soapPerawat.perawat')))),
                m('tr', m('th', 'Dokter'), m('td', lookUser(_.get(i, 'soapDokter.dokter')))),
                i.soapPerawat && [
                  m('tr', m('th', 'Anamnesa Perawat'), m('td', i.soapPerawat.anamnesa)),
                  i.soapPerawat.tekanan_darah &&
                  m('tr', m('th', 'Tekanan darah'), m('td', i.soapPerawat.tekanan_darah))
                ],
                i.soapDokter && [
                  m('tr', m('th', 'Anamnesa Dokter'), m('td', i.soapDokter.anamnesa)),
                  _.map(i.soapDokter.diagnosa, (j, k) =>
                    m('tr', m('th', 'Diagnosa '+k), m('td', j.text+' / ICD X: '+(j.icd10 || '?')))
                  )
                ],
              ),
              m('p.buttons',
                ands([
                  state.login.peranan !== 1,
                  ors([
                    state.login.peranan === 2 && !i.soapPerawat,
                    state.login.peranan === 3 && !i.soapDokter,
                  ]),
                  m('.button.is-success',
                    {onclick: () => _.assign(state, {
                      route: 'formSoap', oneRawat: i, modalVisit: null
                    })},
                    m('span.icon', m('i.fas.fa-user-md')),
                    m('span',
                      state.login.peranan === 3 ?
                      'Soap Dokter' : 'Soap Perawat'
                    )
                  ),
                ]),
                m('.button.is-info',
                  {onclick: () => makePdf.soap(state.onePatient.identitas, i)},
                  m('span.icon', m('i.fas.fa-print')),
                  m('span', 'Cetak SOAP')
                )
              )
            )
          },
          tds([
            hari(i.tanggal),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
        ))
      )
    ),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'igdVisit'},
      m('span.icon', m('i.fas.fa-file-invoice')),
      m('span', 'Kunjungi IGD')
    ),
    makeModal('modalVisit')
  ),
  igdVisit: () => m('.content',
    m('h3', 'Form pendaftaran IGD'),
    m('.box', m(autoForm({
      id: 'igdVisit', autoReset: true,
      schema: _.omit(schemas.rawatJalan, 'klinik'),
      action: doc => [
        updateBoth('patients', state.onePatient._id, _.assign(
          state.onePatient, {emergency:
            (_.get(state, 'onePatient.emergency') || []).concat([doc])
          }
        )),
        state.route = 'onePatient',
        m.redraw()
      ]
    })))
  )
})

/*global _ m comp db state look autoForm insertBoth schemas randomId hari rupiah lookUser ors makeModal updateBoth dbCall tds makeReport withThis moment*/

_.assign(comp, {
  storage: () => !ors([
  _.includes([3, 4], state.login.bidang),
  _.includes([2, 3], state.login.peranan)
  ]) ? m('p', 'Hanya untuk user farmasi, apotik dan petugas medis')
  : m('.content',
    {onupdate: () =>
      db.goods.toArray(array => [
        state.goodsList = array, m.redraw()
      ])
    },
    m('h1', 'Gudang Farmasi'),
    m('.field.has-addons',
      m('.control.is-expanded', m('input.input.is-fullwidth', {
        type: 'text', placeholder: 'cari barang...',
        onkeypress: e =>
          db.goods.filter(i => _.includes(
            _.lowerCase(i.nama+' '+i.kandungan), e.target.value
          )).toArray(array => [
            state.searchGoods = array, m.redraw()
          ])
      })),
      m('.control', m('a.button.is-info', {
        onclick: () => state.searchGoods = null
      }, 'Show All'))
    ),

    m('table.table',
      m('thead', m('tr',
        ['Jenis', 'Nama', 'Satuan', 'Gudang', 'Apotik', 'Retur']
        .map(i => m('th', i))
      )),
      m('tbody', (state.searchGoods || state.goodsList || [])
      .map(i => m('tr',
        {ondblclick: () => _.assign(state, {
          route: 'oneGood', oneGood: i
        })},
        tds([
          look('jenis_barang', +i.jenis),
          i.nama, look('satuan', i.satuan)
        ]),
        i.batch && ['gudang', 'apotik', 'retur']
        .map(j => withThis(
          _.sum(i.batch.map(k =>
            _.get(k.stok, j) || 0
          )),
          stokSum => m('td', {
            class: stokSum < i.stok_minimum[j] && 'has-text-danger'
          }, stokSum)
        ))
      )))
    ),
    m('.button.is-primary',
      {onclick: () => state.route = 'formGood'},
      m('span.icon', m('i.fas.fa-plus')),
      m('span', 'Tambah barang')
    )
  ),

  formGood: () => m('.content',
    m('h3', 'Form input jenis barang baru'),
    m(autoForm({
      id: 'formGood', schema: schemas.barang,
      confirmMessage: 'Yakin untuk menambahkan JENIS barang baru?',
      action: doc => withThis(
        _.merge(doc, {_id: randomId()}),
        obj => [
          insertBoth('goods', obj),
          _.assign(state, {route: 'oneGood', oneGood: obj})
        ]
      )
    }))
  ),

  oneGood: () =>  m('.content',
    {oncreate: () => [
      db.users.toArray(array =>
        state.userList = array
      ),
      dbCall({
        method: 'findOne', collection: 'goods',
        _id: state.oneGood._id
      }, res => db.goods.put(res))
    ]},
    m('h3', 'Rincian barang'),
    m('table.table', _.chunk([
      ['Nama barang', state.oneGood.nama],
      ['Kandungan', state.oneGood.kandungan],
      ['Antibiotik', look('boolean', _.get(state.oneGood, 'kriteria.antibiotik'))],
      ['Narkotika', look('boolean', _.get(state.oneGood, 'kriteria.narkotika'))],
      ['Psikotropika', look('boolean', _.get(state.oneGood, 'kriteria.psikotropika'))],
      ['Fornas', look('boolean', _.get(state.oneGood, 'kriteria.fornas'))],
      ['Min. Gudang', state.oneGood.stok_minimum.gudang],
      ['Min. Apotik', state.oneGood.stok_minimum.apotik]
    ], 3).map(i => m('tr', i.map(j =>
      [m('th', j[0]), m('td', j[1])]
    )))),
    m('p.buttons',
      m('.button.is-primary',
        {onclick: () => state.route = 'formBatch'},
        m('span.icon', m('i.fas.fa-plus-circle')),
        m('span', 'Tambah batch')
      ),
      state.login.peranan === 4 && m('.button.is-warning',
        {
          "data-tooltip": 'Kosongkan semua batch barang ini',
          ondblclick: () => [
            updateBoth('goods', state.oneGood._id, _.assign(
              state.oneGood, {batch: []}
            )), state.route = 'storage', m.redraw()
          ]
        },
        m('span.icon', m('i.fas.fa-recycle')),
        m('span', 'Stok Opname')
      )
    ),
    m('p'), m('h4', 'Daftar batch barang ini'),
    m('table.table',
      m('thead', m('tr',
        ['No. Batch', 'Merek', 'Tanggal Masuk', 'Tanggal Kadaluarsa', 'Gudang', 'Apotik', 'Retur']
        .map(i => m('th', i))
      )),
      m('tbody', (state.oneGood.batch || []).map(i => m('tr',
        {class: +moment() > i.kadaluarsa && 'has-text-danger',
        ondblclick: () => _.assign(state, {
          oneBatch: i, modalBatch: m('.box',
            m('h4', 'Rincian batch'),
            m('table.table', _.chunk([
              ['No. Batch', i.no_batch], ['Merek', i.merek],
              ['Tanggal masuk', hari(i.masuk)],
              ['Tanggal kadaluarsa', hari(i.kadaluarsa)],
              ['Harga beli', rupiah(i.harga.beli)],
              ['Harga jual', rupiah(i.harga.jual)],
              ['Stok Gudang', i.stok.gudang],
              ['Stok Apotik', _.get(i, 'stok.apotik')],
              ['Jumlah Diretur', _.get(i, 'stok.return')],
              ['Nama supplier', _.get(i, 'sumber.supplier')],
              ['Anggaran', _.get(i, 'sumber.anggaran')],
              ['No. SPK', _.get(i, 'sumber.no_spk')],
              ['Tanggal SPK', hari(_.get(i, 'sumber.tanggal_spk'))],
              ['Petugas', lookUser(i.petugas)],
            ], 2).map(j => m('tr', j.map(k =>
              [m('th', k[0]), m('td', k[1])]
            )))),
            state.login.peranan === 4 && m('p.buttons',
              m('.button.is-warning',
                {
                  "data-tooltip": 'Pindahkan semua stok barang ini ke Retur',
                  ondblclick: () => [
                    updateBoth('goods', state.oneGood._id, _.assign(
                      state.oneGood, {batch: state.oneGood.batch.map(j =>
                        j.idbatch === i.idbatch ?
                        _.assign(j, {stok: {gudang: 0, apotik: 0, retur:
                          (i.stok.gudang || 0) + (i.stok.apotik || 0)
                        }}) : j
                      )}
                    )), state.modalBatch = null, m.redraw()
                  ]
                },
                m('span.icon', m('i.fas.fa-exchange-alt')),
                m('span', 'Retur batch')
              ),
              m('.button.is-danger',
                {ondblclick: e => [
                  updateBoth('goods', state.oneGood._id, _.assign(
                    state.oneGood, {batch: state.oneGood.batch.filter(j =>
                      j.idbatch !== i.idbatch
                    )}
                  )), state.modalBatch = null, m.redraw()
                ]},
                m('span.icon', m('i.fas.fa-trash')),
                m('span', 'Hapus batch')
              )
            ),
            m('br'),
            i.amprah && m('div',
              m('h4', 'Riwayat Amprah'),
              m('table.table',
                m('thead', m('tr',
                  ['Peminta', 'Asal', 'Diminta', 'Diserah', 'Penyerah']
                  .map(j => m('th', j))
                )),
                m('tbody', i.amprah.map(j => m('tr', tds([
                  lookUser(j.peminta), look('bidang', j.ruangan), j.diminta,
                  j.diserah, lookUser(j.penyerah),
                ]))))
              ),
            ), m('br'),
            ors([
              _.includes([4], state.login.bidang),
              _.includes([2, 3], state.login.peranan)
            ]) && [
              m('h4', 'Form amprah batch'),
              m(autoForm({
                id: 'formAmprah', schema: schemas.amprah,
                action: doc => [
                  updateBoth('goods', state.oneGood._id,
                    _.assign(state.oneGood, {batch:
                      state.oneGood.batch.map(j =>
                        j.idbatch === state.oneBatch.idbatch ?
                        _.assign(state.oneBatch, {amprah:
                          (state.oneBatch.amprah || []).concat([doc])
                        }) : j
                      )
                    })
                  ), state.modalBatch = null, m.redraw()
                ]
              }))
            ]
          )})
        },
        tds([
          i.no_batch, i.merek, hari(i.masuk), hari(i.kadaluarsa),
          i.stok.gudang || 0, i.stok.apotik || 0, i.stok.retur || 0
        ])
      )))
    ),
    makeModal('modalBatch')
  ),
  formBatch: () => m('.content',
    m('h3', 'Form tambah batch'),
    m(autoForm({
      id: 'formBatch', schema: schemas.batch_obat,
      action: doc => [
        updateBoth('goods', state.oneGood._id, _.assign(state.oneGood, {
          batch: (state.oneGood.batch || []).concat([doc])
        })), state.route = 'oneGood'
      ]
    }))
  )
})

/*global _ m comp db state autoForm schemas updateBoth lookUser hari makeModal tds ands ors look*/

_.assign(comp, {
  transfer: () => !ors([
    _.includes([3, 4], state.login.bidang),
    _.includes([2, 3], state.login.peranan)
  ])
  ? m('p', 'Hanya untuk user farmasi, apotik dan petugas medis')
  : m('.content',
    m('h3', 'Daftar antrian amprah'),
    m('table.table',
      {onupdate: () => [
        db.users.toArray(array =>
          state.userList = array
        ),
        db.goods.toArray(array => [
          state.transferList = array.reduce((a, b) =>
            b.batch ? a.concat(b.batch.reduce((c, d) =>
              d.amprah ? c.concat(d.amprah.reduce((e, f) =>
                e.concat([_.merge(f, {
                  idbarang: b._id, nama_barang: b.nama,
                  idbatch: d.idbatch, no_batch: d.no_batch,
                  digudang: d.stok.gudang
                })])
              , [])) : c
            , [])) : a
          , []), m.redraw()
        ])
      ]},
      m('thead', m('tr',
        ['Nama barang', 'No. Batch', 'Peminta', 'Asal Ruangan', 'Jumlah minta', 'Tanggal diminta']
        .map((i => m('th', i)))
      )),
      m('tbody', state.transferList &&
        state.transferList.map(i => m('tr',
        {ondblclick: () => [
          state.login.bidang === 3 &&
          _.assign(state, {
            oneAmprah: i, modalResponAmprah: m('.box',
              m('h4', 'Respon permintaan barang'),
              m('table.table',
                m('thead', m('tr',
                  ['Nama barang', 'No. Batch', 'Stok gudang', 'Jumlah minta']
                  .map(j => m('th', j))
                )),
                m('tbody', m('tr', tds([
                  i.nama_barang, i.no_batch, i.digudang, i.diminta
                ])))
              ),
              m(autoForm({
                id: 'formResponAmprah', schema: schemas.responAmprah,
                action: doc =>
                  db.goods.get(i.idbarang, barang => [
                    updateBoth('goods', i.idbarang, _.assign(barang, {batch:
                      barang.batch.map(a =>
                        a.idbatch === i.idbatch ?
                        _.assign(a, {
                          stok: {
                            gudang: a.stok.gudang - doc.diserah,
                            apotik:
                              state.oneAmprah.ruangan === 4
                              ? (a.stok.apotik || 0) + doc.diserah
                              : a.stok.apotik
                          },
                          amprah: a.amprah.map(b =>
                            b.idamprah === i.idamprah
                            ? _.assign(b, doc) : b
                          )
                        }) : a
                      )
                    })),
                    state.modalResponAmprah = null,
                    m.redraw()
                  ])
              }))
            )
          }),
          m.redraw()
        ]},
        !i.penyerah && tds([
          i.nama_barang, i.no_batch, lookUser(i.peminta),
          look('bidang', i.ruangan), i.diminta, hari(i.tanggal_minta, true)
        ])
      ))),
      makeModal('modalResponAmprah')
    ),
    m('p'),
    m('h3', 'Daftar riwayat amprah'),
    m('table.table',
      m('thead', m('tr',
        ['Nama barang', 'No. Batch', 'Peminta', 'Jumlah minta', 'Tanggal diminta', 'Penyerah', 'Jumlah serah', 'Tanggal serah']
        .map(i => m('th', i))
      )),
      m('tbody', state.transferList &&
        state.transferList.map(i => m('tr',
          i.penyerah && tds([
            i.nama_barang, i.no_batch,
            lookUser(i.peminta), i.diminta, hari(i.tanggal_minta, true),
            lookUser(i.penyerah), i.diserah, hari(i.tanggal_serah, true)
          ])
        ))
      )
    )
  )
})

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
            {
              updatedGoods: _.compact(i.obats.flatMap(a =>
                state.goodsList.flatMap(b =>
                  b._id === a.idbarang && _.assign(b, {batch:
                    b.batch.sort((p, q) =>
                      p.kadaluarsa - q.kadaluarsa
                    ).reduce((c, d) => withThis(
                      _.min([d.stok.apotik, a.jumlah]),
                      minim => ors([
                        ands([a.jumlah, d.stok.apotik]) &&
                        ands([
                          _.forEach(_.range(minim), () => a.jumlah--),
                          serahList.push(_.merge({}, a, {
                            nama_barang: b.nama, no_batch: d.no_batch,
                            serahkan: minim, jual: minim * d.harga.jual,
                          })),
                          c.concat([_.assign(d, {stok: _.assign(d.stok, {
                            apotik: d.stok.apotik - minim
                          })})])
                        ]),
                        c.concat([d])
                      ])
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
                    {ondblclick: () => [
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
                !i.rawat.klinik ? tarifIGD :
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
                !i.rawat.klinik ? tarifIGD :
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
                  m('tr', m('th', 'Daftar pasien baru'), m('td', rupiah(tarifKartu)))
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
                    m('td', rupiah(tarifIGD))
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
                    ).length === 1 ? tarifKartu : 0,
                    rawat.klinik ? 1000*+look('tarif_klinik', rawat.klinik) : tarifIGD,
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

/*global _ m comp state autoForm schemas insertBoth makeModal db updateBoth look paginate rupiah Papa ors randomId tds dbCall withThis moment*/

_.assign(comp, {
  users: () => state.login.bidang !== 5 ?
  m('p', 'Hanya untuk user manajemen') : m('.content',
    m('h3', 'Manajemen Akun'),
    m('.button.is-primary',
      {onclick: () =>
        state.modalAccount = m('.box',
          m('h3', 'Tambah Akun'),
          m(autoForm({
            id: 'createAccount', schema: schemas.account,
            action: doc => [
              insertBoth('users', doc),
              state.modalAccount = null
            ]
          }))
        )
      },
      m('span.icon', m('i.fas.fa-user-plus')),
      m('span', 'Tambah akun')
    ),
    makeModal('modalAccount'),
    m('table.table',
      {onupdate: () => db.users.toArray(array => [
        state.userList = array, m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama lengkap', 'Username', 'Peranan', 'Bidang', 'Poliklinik', 'Keaktifan']
        .map(i => m('th', i)))
      ),
      m('tbody', (state.userList.filter(i =>
        i.keaktifan === 1
      ) || []).map(i =>
        m('tr',
          {ondblclick: () =>
            state.modalAccount = m('.box',
              m('h4', 'Profil Pengguna'),
              m(autoForm({
                id: 'updateAccount', schema: schemas.account,
                doc: i, action: doc => [
                  updateBoth('users', i._id, doc),
                  state.modalAccount = null, m.redraw()
                ]
              }))
            )
          },
          tds([
            i.nama, i.username,
            look('peranan', i.peranan),
            look('bidang', i.bidang),
            look('klinik', i.poliklinik),
            look('keaktifan', i.keaktifan)
          ])
        )
      ))
    )
  ),

  references: () => !_.includes([2, 5], state.login.bidang) ?
  m('p', 'Hanya untuk user manajemen dan kasir') : m('.content',
    m('h3', 'Daftar Tarif'),
    m('table.table',
      {oncreate: () => db.references.toArray(array => [
        state.referenceList = _.sortBy(array, ['nama']),
        m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama item', 'Harga', 'Grup 1', 'Grup 2', 'Grup 3']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.referenceList &&
        paginate(state.referenceList, 'references', 20)
        .map(i => m('tr', tds([
          i.nama, rupiah(i.harga), i[0], i[1], i[2]
        ])))
      )
    ),
    m('div',comp.pagination(
      'references',
      _.get(state, 'referenceList.length') / 20
    )),
    [
      m('h3', 'Import Data'),
      m('.file.is-danger',
        {onchange: e => Papa.parse(e.target.files[0], {
          header: true, complete: result => withThis(
            (collName, docs) => [
              dbCall({
                method: 'insertMany', collection: collName, documents: docs
              }, () => ''),
              db[collName].bulkPut(docs).then(last =>
                last && alert('Berhasil import, silahkan refresh')
              )
            ],
            updater => ors([
              result.data[0].harga && updater(
                'references', result.data.map(i =>
                  _.merge(i, {_id: randomId(), updated: _.now()})
                )
              ),
              result.data[0].nama_lengkap && updater('patients',
                result.data.map(i => _.merge(
                  {updated: _.now(), _id: randomId()},
                  {identitas: _.merge(
                    {
                      keluarga: {ayah: i.ayah, ibu: i.ibu, pasangan: i.pasangan},
                      kontak: i.kontak, nama_lengkap: _.startCase(i.nama_lengkap),
                      tanggal_input: +moment(i.tanggal_input),
                      tanggal_lahir: +moment(i.tanggal_lahir),
                      tempat_lahir: i.tempat_lahir, tempat_tinggal: i.tempat_tinggal,
                      bayar_kartu: true
                    },
                    _.fromPairs(
                      ['agama', 'alias', 'darah', 'kelamin', 'ktp',
                       'nikah', 'no_mr', 'pekerjaan', 'pendidikan']
                      .map(j => +i[j] && [j, +i[j]])
                    )
                  )}
                ))
              ),
              result.data[0].no_batch && updater('goods',
                result.data.map(i => _.merge(
                  {_id: randomId(), updated: _.now()},
                  {
                    nama: i.nama, jenis: +i.jenis, kandungan: i.kandungan,
                    satuan: +i.satuan, kriteria: {
                      antibiotik: +i.antibiotik, narkotika: +i.narkotika,
                      psikotropika: +i.psikotropika, fornas: +i.fornas
                    },
                    batches: [{
                      idbatch: randomId(), no_batch: i.no_batch, merek: i.merek,
                      masuk: i.masuk && +moment(i.masuk),
                      kadaluarsa: i.kadaluarsa && +moment(i.kadaluarsa),
                      stok: {gudang: +i.digudang, apotik: +i.diapotik, retur: +i.diretur},
                      harga: {beli: +i.beli, jual: +i.jual}, returnable: !!i.returnable,
                      sumber: {
                        supplier: i.supplier, anggaran: +i.anggaran, no_spk: i.no_spk,
                        tanggal_spk: i.tanggal_spk && +moment(i.tanggal_spk)
                      }
                    }]
                  }
                ))
              )
            ])
          )
        })},
        m('label.file-label',
          m('input.file-input', {type: 'file', name: 'import'}),
          m('span.file-cta', m('span.file-label', 'Pilih file'))
        )
      )
    ]
  ),

  pagination: (id, length) => [
    state.pagination = state.pagination || {[id]: _.get(state.pagination, id) || 0},
    m('nav.pagination', m('.pagination-list',
      _.range(length).map(i => m('div', m('a.pagination-link', {
        class: i === state.pagination[id] && 'is-current',
        onclick: () => [
          state.pagination[id] = i, m.redraw()
        ]
      }, i+1)))
    ))
  ][1],
})

/*global _ m comp makePdf ands selects insertBoth db startOfTheDay moment*/

_.assign(comp, {
  queue: () => m('.content',
    m('table.is-fullwidth', m('tr',
      {oncreate: () => db.queue.toArray(
        array => localStorage.setItem('regQueue', array.filter(
          i => i.timestamp > startOfTheDay(+moment())
        ).length)
      )},
      m('th', m('h1', 'Antrian Pendaftaran')),
      m('th', m('h1', 'R'+(localStorage.regQueue || 0)))
    )),
    m('.buttons',
      m('.button', {
        onclick: () => ands([
          insertBoth('queue', {
            timestamp: +moment(),
            no_antrian: 'R'+(+localStorage.regQueue+1)
          }),
          makePdf.regQueue(+localStorage.regQueue),
          localStorage.setItem('regQueue', +localStorage.regQueue+1)
        ])
      }, 'Cetak antrian'),
      m('.button', {
        onclick: () => localStorage.setItem('regQueue', 0)
      }, 'Reset Antrian')
    ),
    Array(3).map(i => m('br')),
    m('h1', 'Antrian Poliklinik'),
    m('table.is-fullwidth.is-striped',
      selects('klinik')().map(i => m('tr',
        m('td', m('h2', i.label))
      ))
    )
  )
})
/*global _ m comp state db tds hari lookReferences moment*/

_.assign(comp, {
  surgery: () => m('.content',
    m('h1', 'Jadwal Instalasi Bedah'),
    m('table.table',
      {
        oncreate: () =>
          db.references.toArray(array => state.references = array),
        onupdate: () =>
          db.patients.toArray(array => state.surgeryList = array.map(i =>
            ([]).concat(i.rawatJalan, i.emergency).flatMap(j =>
              j && j.soapDokter && j.soapDokter.tindakan &&
              j.soapDokter.tindakan.map(k =>
                (k.jadwal > +moment()) && _.merge(i, j, k)
              ).filter(Boolean)
            ).filter(Boolean)
          ).filter(x => x.length))
      },
      m('tr', ['Nama Pasien', 'Jadwal Operasi', 'Nama Tindakan'].map(i => m('th', i))),
      state.surgeryList && _.flatten(state.surgeryList).map(i => m('tr', tds([
        i.identitas.nama_lengkap,
        hari(i.jadwal, true),
        lookReferences(i.idtindakan).nama
      ])))
    )
  )
})
/*global m _ comp state look makeModal autoForm updateBoth io*/

_.assign(comp, {
  profile: () => m('.content',
    m('br'), m('h1', 'Profil Pengguna'),
    m('table.table', m('tbody',
      m('tr',
        m('th', 'Username'),
        m('td', state.login.username)
      ),
      m('tr',
        m('th', 'Password'),
        m('td', '*************'),
      ),
      m('tr',
        m('th', 'Nama Lengkap'),
        m('td', state.login.nama)
      ),
      m('tr',
        m('th', 'Bidang'),
        m('td', look('bidang', state.login.bidang))
      ),
      m('tr',
        m('th', 'Peranan'),
        m('td', look('peranan', state.login.peranan))
      )
    )),
    m('.button.is-warning', {
      onclick: () => state.modalProfile = m('.box',
        m(autoForm({
          id: 'formProfile',
          schema: {
            username: {
              type: String, optional: true,
              autoform: {
                placeholder: 'Bila tidak ingin diganti, kosongkan saja'
              }
            },
            password: {type: String, optional: true, autoform: {
              type: 'password',
              placeholder: 'Bila tidak ingin diganti, kosongkan saja'
            }},
            nama: {type: String, optional: true, label: 'Nama Lengkap', autoform: {
              placeholder: 'Bila tidak ingin diganti, kosongkan saja'
            }}
          },
          action: doc => [
            doc.password ?
            io().emit('passwordCrypt', doc.password, res =>
              updateBoth('users', state.login.id, _.assign(state.login, doc, {password: res}))
            ) : updateBoth('users', state.login.id, _.assign(state.login, doc)),
            state.modalProfile = null, m.redraw()
          ]
        }))
      )
    }, 'Ganti'),
    makeModal('modalProfile')
  )
})
/*global _ comp m state menus look collNames db gapi dbCall withThis io autoForm schemas moment getDiferences */

_.assign(comp, {
  navbar: () => m('nav.navbar.is-primary',
    m('.navbar-brand', m('a.navbar-item', {
      onclick: () => state.route = 'dashboard'
    }, 'RS Medicare')),
    m('.navbar-menu',
      m('.navbar-start', _.map(menus, (val, key) =>
        m('a.navbar-item',
          {
            class: val.children && 'has-dropdown is-hoverable',
            onclick: () => state.route = key
          },
          val.children ? [
            m('a.navbar-link', _.startCase(val.full)),
            m('.navbar-dropdown', _.map(val.children, (i, j) =>
              m('a.navbar-item', {onclick: e =>
                [e.stopPropagation(), state.route = j]
              }, i.full)
            ))
          ] : _.startCase(val.full)
        )
      )),
      m('.navbar-end', m('.navbar-item.has-dropdown.is-hoverable',
        m('a.navbar-link', {
          onclick: () => [state.route = 'profile', m.redraw()]
        }, _.get(state.login, 'username')),
        m('.navbar-dropdown',
          m('a.navbar-item',
            'Peranan: '+ look('peranan', _.get(state.login, 'peranan'))
          ),
          m('a.navbar-item',
            'Bidang: '+look('bidang', _.get(state.login, 'bidang'))
          ),
          m('a.navbar-item',
            'Poliklinik: '+
            look('klinik', _.get(state.login, 'poliklinik'))
          ),
          m('a.navbar-item', {onclick: () => [
            _.assign(state, {login: null, route: 'login', loading: false}),
            localStorage.removeItem('login'),
            m.redraw()
          ]},'Logout')
        )
      ))
    ),
  ),

  dashboard: () => m('.content',
    m('h1', {oncreate: () => [
      getDifferences(),
      db.users.toArray(array =>
        state.userList = array
      )
    ]}, 'Dashboard'),
    m('.buttons',
      m('.button.is-info', {
        class: state.loading && 'is-loading',
        onclick: () => [state.loading = true, getDifferences()]
      }, 'Sync'),
      state.lastSync && m('span',
        'Terakhir sinkronisasi ' + moment(state.lastSync).fromNow()
      ),
    ),
    _.chunk(_.values(menus), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('.box', m('article.media',
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j.icon))
          ),
          m('.media-content', m('.content',m('h3', j.full)))
        ))
      )))
    )
  ),

  login: () => m('.content', m('.columns',
    m('.column'),
    m('.column',
      state.error && m('.notification.is-danger.is-light', [
        m('button.delete', {onclick: () => state.error = false}),
        state.error
      ]),
      m(autoForm({
        id: 'login', schema: schemas.login,
        submit: {
          value: 'Login',
          class: state.loading ? 'is-info is-loading' : 'is-info'
        },
        action: (doc) => [
          state.loading = true, m.redraw(),
          io().emit('login', doc, ({res}) => res ? [
            _.assign(state, {username: doc.username, route: 'dashboard'}),
            db.users.filter(i => i.username === state.username)
            .toArray(i => [
              state.login = i[0],
              localStorage.setItem('login', JSON.stringify(i[0])),
              m.redraw()
            ]),
            m.redraw()
          ] : [
            state.loading = false,
            state.error = 'Password salah',
            m.redraw()
          ])
        ]
      }))
     ),
    m('.column')
  ))
})

io().on('connect', () => [
  state.login = JSON.parse(localStorage.login || '{}'),
  m.mount(document.body, {view: () => m('div',
    comp.navbar(), m('.container', m('br'),
      _.get(state, 'login.username') ? comp[state.route]() : comp.login()
    )
  )}),
  io().on('datachange', (name, doc) => [
    db[name].put(doc),
    state.lastSync = +moment()
  ])
])
