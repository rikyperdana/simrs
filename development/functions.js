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

dbCall = (body, action) =>
  io().emit('dbCall', body, action),

insertBoth = (collName, doc, cb) => withThis(
  _.merge(doc, {_id: randomId(), updated: _.now()}),
  obj => [
    db[collName].put(obj),
    dbCall({
      method: 'insertOne', collection: collName, document: obj
    }, res => ands([res, cb]) && cb(res)),
    io().emit('datachange', collName, doc)
  ]
),

updateBoth = (collName, _id, doc, cb) => withThis(
  _.merge(doc, {_id: _id, updated: _.now()}),
  obj => [
    db[collName].put(obj)
    .then(res => ands([res, cb]) && cb(res)),
    dbCall({
      method: 'updateOne', collection: collName,
      document: obj, _id: _id
    }, res => ands([res, cb]) && cb(res)),
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
), // BUG: yg di dalam modal tidak mempan m.redraw()

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

collNames = ['patients', 'goods', 'references', 'users', 'queue'],

state = {route: 'dashboard'}, comp = {},

menus = {
  registration: {
    full: 'Pendaftaran', icon: 'address-book',
    children: {
      icd: {full: 'Kodifikasi'},
      queue: {full: 'Antrian'}
    }
  },
  emergency: {full: 'IGD', icon: 'heartbeat'},
  outpatient: {full: 'Rawat Jalan', icon: 'walking'},
  inpatient: {
    full: 'Rawat Inap', icon: 'bed',
    children: {
      beds: {full: 'Daftar Kamar'},
      surgery: {full: 'Antrian Bedah'}
    }
  },
  cashier: {full: 'Kasir', icon: 'cash-register'},
  storage: {
    full: 'Storage', icon: 'cubes',
    children: {
      transfer: {full: 'Amprah'}
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

db = new Dexie('simrs'),

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

db.version(1).stores(collNames.reduce((res, inc) =>
  _.merge(res, {[inc]: '_id'})
, {}))