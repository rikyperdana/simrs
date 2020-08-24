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

rupiah = num =>
  'Rp '+numeral(num || 0).format('0,0'),

tds = array =>
  array.map(i => m('td', i)),

paginate = (array, name, length) => array.slice(
  _.get(state, ['pagination', name]) * length,
  _.get(state, ['pagination', name]) * length + length,
),

dbCall = (body, action) =>
  io().emit('dbCall', body, action),

insertBoth = (collName, doc, cb) => withThis(
  _.merge(doc, {_id: randomId(), updated: _.now()}),
  obj => dbCall({
    method: 'insertOne', collection: collName, document: obj
  }, res => res && [
    cb && cb(res),
    db[collName].put(obj),
    io().emit('datachange', collName, doc)
  ])
),

updateBoth = (collName, _id, doc, cb) => withThis(
  _.merge(doc, {_id, updated: _.now()}),
  // pastikan di server terupdate dulu, baru client
  obj => dbCall({
    method: 'updateOne', collection: collName,
    document: obj, _id
  }, res => res && [
    cb && cb(res),
    db[collName].put(obj),
    io().emit('datachange', collName, doc)
  ])
),

deleteBoth = (collName, _id, cb) => dbCall({
  method: 'deleteOne', collection: collName, _id
}, res => res && [
  cb && cb(res),
  db[collName].delete(_id)
]),

makeIconLabel = (icon, label) => [
  m('span.icon', m('i.fas.fa-'+icon)),
  m('span', label)
],

makeModal = name => m('.modal',
  {class: state[name] && 'is-active'},
  m('.modal-background'),
  m('.modal-content', state[name]),
  m('.modal-close.is-large', {onclick: () =>
    [state[name] = null, m.redraw()]
  })
), // BUG: yg di dalam modal tidak mempan m.redraw()

makeReport = (name, action, selections) => m('.box',
  m('h4', 'Unduh Laporan '+name),
  m('form.field-body', {onsubmit: action},
    m('.field', m('.control.is-expanded',
      m('input.input', {type: 'date', name: 'start'})
    )),
    m('.field', m('.control.is-expanded',
      m('input.input', {type: 'date', name: 'end'})
    )),
    selections &&
    m('.field', m('.control.is-expanded',
      m('.select.is-fullwidth', m('select', selections.map(
        i => m('option', {value: i.value}, i.label)
      )))
    )),
    m('input.button.is-primary',
      {type: 'submit', value: 'Unduh'}
    )
  )
),

tarifInap = (masuk, keluar, tarif) =>
  (daysDifference(keluar - masuk) || 1) * 1000 * +tarif,

tarifIGD = 45000, tarifKartu = 8000,

collNames = ['patients', 'goods', 'references', 'users', 'queue'],

state = {route: 'dashboard'}, comp = {},

menus = {
  registration: {
    full: 'Pendaftaran', icon: 'address-book',
    children: {
      icd: {full: 'Kodifikasi', icon: 'code'},
      queue: {full: 'Antrian', icon: 'stream'}
    }
  },
  emergency: {full: 'IGD', icon: 'heartbeat'},
  outpatient: {full: 'Rawat Jalan', icon: 'walking'},
  inpatient: {
    full: 'Rawat Inap', icon: 'bed',
    children: {
      beds: {full: 'Daftar Kamar', icon: 'bed'},
      surgery: {full: 'Antrian Bedah', icon: 'procedures'}
    }
  },
  cashier: {full: 'Kasir', icon: 'cash-register'},
  storage: {
    full: 'Storage', icon: 'cubes',
    children: {
      transfer: {full: 'Amprah', icon: 'exchange-alt'}
    }
  },
  pharmacy: {full: 'Apotik', icon: 'pills'},
  management: {
    full: 'Manajemen', icon: 'users',
    children: {
      users: {full: 'Pengguna', icon: 'users'},
      references: {full: 'Referensi', icon: 'file-contract'}
    }
  }
},

betaMenus = {
  laboratory: {full: 'Laboratorium', icon: 'flask'},
  radiology: {full: 'Radiologi', icon: 'radiation'},
  cssd: {full: 'Laundry', icon: 'tshirt'},
  gizi: {full: 'Gizi', icon: 'utensils'}
},

makeRincianSoapPerawat = soapPerawat => soapPerawat && [
  m('tr', m('th', 'Anamnesa Perawat'), m('td', soapPerawat.anamnesa)),
  withThis(
    _.get(soapPerawat, 'fisik.tekanan_darah'),
    tensi => m('tr',
      m('th', 'Tekanan Darah'),
      m('td', tensi.systolic+'/'+tensi.diastolic)
    )
  ),
  ['nadi', 'suhu', 'pernapasan', 'tinggi', 'berat', 'lila']
  .map(j => _.get(soapPerawat.fisik, j) && m('tr',
    m('th', _.startCase(j)),
    m('td', soapPerawat.fisik[j])
  )),
  soapPerawat.tracer && m('tr',
    m('th', 'File Tracer'),
    m('td', soapPerawat.tracer)
  )
],

makeRincianSoapDokter = soapDokter => soapDokter && [
  m('tr', m('th', 'Anamnesa Dokter'), m('td', soapDokter.anamnesa)),
  _.map(soapDokter.diagnosa, (j, k) =>
    m('tr', m('th', 'Diagnosa '+(k+1)), m('td', j.text+' / ICD X: '+(j.icd10 || '?')))
  ),
  soapDokter.tindakan &&
  soapDokter.tindakan.map(j => j && m('tr',
    m('th', _.get(lookReferences(j.idtindakan), 'nama')),
    m('td', _.get(lookReferences(j.idtindakan), 'harga'))
  )),
  // bhp sementara ini belum ditampilkan
  soapDokter.obat &&
  soapDokter.obat.map(j => j && m('tr',
    m('th', _.get(lookGoods(j.idbarang), 'nama')),
    m('td', j.harga)
  )),
  soapDokter.planning && m('tr',
    m('th', 'Planning'),
    m('td', soapDokter.planning)
  ),
  soapDokter.keluar && m('tr',
    m('th', 'Pilihan keluar'),
    m('td', look('keluar', soapDokter.keluar))
  ),
  soapDokter.rujuk && m('tr',
    m('th', 'Konsul ke poli lain'),
    m('td', look('klinik', soapDokter.rujuk))
  ),
  soapDokter.tracer && m('tr',
    m('th', 'File Tracer'),
    m('td', soapDokter.tracer)
  ),
  localStorage.openBeta && [
    (soapDokter.radio || []).map((j, k) => m('tr',
      m('th', 'Cek radiologi '+(k+1)),
      m('td', {"data-tooltip": j.diagnosa}, lookReferences(j.idradio).nama),
      j.diagnosa && m('td', m('.button.is-info', {
        "data-tooltip": 'Cetak lembar hasil diagnosa radiologi',
        onclick: () => makePdf.radio(state.onePatient.identitas, j)
      }, makeIconLabel('print', '')))
    )),
    (soapDokter.labor || []).map((j, k) => m('tr',
      m('th', 'Cek labor '+(k+1)),
      m('td', {"data-tooltip": j.diagnosa}, lookReferences(j.idlabor).nama),
      m('td', j.hasil)
    ))
  ]
],

db = new Dexie('simrs'),

getDifference = name =>
  db[name].toArray(array =>
    dbCall({
      method: 'getDifference', collection: name,
      clientColl: array.map(i =>
        _.pick(i, ['_id', 'updated'])
      )
    }, res => res && [
      db[name].bulkPut(res),
      state.lastSync = +moment(),
      state.loading = false,
      m.redraw()
    ])
  ),

getDifferences = () =>
  collNames.map(name => getDifference(name))

db.version(1).stores(collNames.reduce((res, inc) =>
  _.merge(res, {[inc]: '_id'})
, {}))
