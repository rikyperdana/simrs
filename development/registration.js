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
