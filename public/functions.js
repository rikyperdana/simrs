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

startOfTheDay = (timestamp) => (new Date(withThis(
  new Date(timestamp), date => [
    date.getFullYear(),
    date.getMonth()+1,
    date.getDate()
  ].join('-')
))).getTime(),

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
  obj => db[collName].put(obj) && dbCall({
    method: 'insertOne', collection: collName, document: obj
  }, () => '')
),

updateBoth = (collName, _id, doc) => withThis(
  _.merge(doc, {_id: _id, updated: _.now()}),
  obj => db[collName].put(obj) && dbCall({
    method: 'updateOne', collection: collName,
    document: obj, _id: _id
  }, () => '')
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

db = new Dexie('medicare')

db.version(1).stores(collNames.reduce((res, inc) =>
  _.merge(res, _.fromPairs([[inc, '_id']]))  
, {}))