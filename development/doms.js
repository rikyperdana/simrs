/*global _ m state comp lookReferences makePdf withThis look lookGoods*/

var tds = array =>
  array.map(i => m('td', i)),

paginate = (array, name, length) => array.slice(
  _.get(state, ['pagination', name]) * length,
  _.get(state, ['pagination', name]) * length + length,
),

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
    m('tr', m('th', 'Diagnosa '+(k+1)), m('td', j.text+' / ICD X: '+(j.code || '?')))
  ),
  (soapDokter.tindakan || []).map(j => j && m('tr',
    m('th', _.get(lookReferences(j.idtindakan), 'nama')),
    m('td', rupiah(_.get(lookReferences(j.idtindakan), 'harga')))
  )),
  // bhp sementara ini belum ditampilkan
  (soapDokter.obat || []).map(j => j && m('tr',
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

_.assign(comp, {
  pagination: (id, length) => [
    state.pagination = state.pagination ||
      {[id]: _.get(state.pagination, id) || 0},
    m('nav.pagination', m('.pagination-list',
      _.range(length).map(i => m('div', m('a.pagination-link', {
        class: i === state.pagination[id] && 'is-current',
        onclick: () => [state.pagination[id] = i, m.redraw()]
      }, i+1)))
    ))
  ][1]
})
