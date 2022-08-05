/*global _ comp m state db hari autoForm schemas insertBoth updateBoth randomId tds withAs ands startOfTheDay moment makeIconLabel reports layouts*/

_.assign(comp, {
  registration: () => state.login.bidang !== 1 ?
  m('p', 'Hanya untuk user pendaftaran') : m('.content',
    state.login.peranan === 4 && [
      reports.outpatient(),
      reports.igd(),
      reports.inpatient(),
    ],
    m('h1', 'Pencarian Pasien'),
    m('.control.is-expanded', m('input.input.is-fullwidth', {
      type: 'text', placeholder: 'Cari dengan nama lengkap atau No. MR',
      onkeypress: e => [
        ands([
          e.key === 'Enter',
          e.target.value.length > 3
        ]) && [
          state.loading = true, m.redraw(),
          db.patients.filter(i => _.includes(
            _.lowerCase(i.identitas.nama_lengkap)+i.identitas.no_mr,
            _.lowerCase(e.target.value)
          )).toArray(array => [
            _.assign(state, {
              searchPatients: array,
              loading: false
            }), m.redraw()
          ])
        ]
      ]
    })), m('br'),
    state.loading && m('progress.progress.is-small.is-primary'),
    state.searchPatients && m('p.help', '* Berurut berdasarkan tanggal lahir'),
    m('.box', m('.table-container', m('table.table.is-striped',
      m('thead', m('tr',
        ['Kunjungan Terakhir', 'No. MR', 'Nama lengkap', 'Tanggal lahir', 'Tempat lahir', 'Alamat']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.searchPatients || [])
        .sort((a, b) => a.identitas.tanggal_lahir - b.identitas.tanggal_lahir)
        .map(i => m('tr',
          {onclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i, searchPatients: null
          })},
          tds([
            hari(_.get(_.last([...(i.rawatJalan || []), ...(i.emergency || [])]), 'tanggal')),
            i.identitas.no_mr, i.identitas.nama_lengkap,
            hari(i.identitas.tanggal_lahir), i.identitas.tempat_lahir, i.identitas.tempat_tinggal
          ])
        ))
      )
    ))),
    state.searchPatients &&
    m('.button.is-primary',
      {onclick: () => _.assign(state, {
        route: 'newPatient', searchPatients: null
      })},
      makeIconLabel('user-plus', 'Pasien baru')
    )
  ),

  newPatient: () => m('.content',
    m('h3', 'Pendaftaran Pasien Baru'),
    m('.buttons',
      m('.button.is-primary',
        {
          'data-tooltip': 'Ambil No. MR terakhir + 1',
          onclick: () => db.patients.toArray(array => [
            state.new_no_mr = array.reduce(
              (acc, inc) => withAs(
                _.get(inc, 'identitas.no_mr'),
                no_mr => no_mr > acc ? no_mr : acc
              ), 0
            ) + 1,
            m.redraw()
          ])
        },
        makeIconLabel('plus', 'Auto No.MR')
      ),
    ),
    m(autoForm({
      id: 'newPatient', schema: schemas.identitas,
      layout: layouts.patientForm,
      confirmMessage: 'Yakin ingin menambahkan pasien BARU?',
      action: doc => withAs(
        {identitas: doc, _id: randomId()}, obj => [
          insertBoth('patients', obj),
          doc.no_antrian && db.queue.toArray(arr => withAs(
            arr.find(i => i.no_antrian === doc.no_antrian),
            obj => updateBoth('queue', obj._id, _.merge(obj, {done: true}))
          )),
          _.assign(state, {route: 'onePatient', onePatient: obj, new_no_mr: null})
        ]
      )
    }))
  ),

  updatePatient: () => m('.content',
    m('h3', 'Update identitas pasien'),
    m(autoForm({
      id: 'updatePatient', schema: schemas.identitas,
      layout: layouts.patientForm,
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
      layout: layouts.poliVisit,
      confirmMessage: 'Yakin untuk mendaftarkan pasien ke klinik?',
      action: doc => db.patients.filter(i =>
        i.rawatJalan && i.rawatJalan.filter(j => ands([
          j.klinik === 1,
          j.tanggal > startOfTheDay(+moment())
        ])).length
      ).toArray(array => [
        updateBoth('patients', state.onePatient._id, _.assign(
          state.onePatient, {rawatJalan: [
            ...(state.onePatient.rawatJalan || []),
            _.merge(doc, {antrian: array.length+1})
          ]}
        )),
        doc.no_antrian && db.queue.toArray(arr => withAs(
          arr.find(i => i.no_antrian === doc.no_antrian),
          obj => updateBoth('queue', obj._id, _.merge(obj, {done: true}))
        )),
        state.route = 'onePatient',
        m.redraw()
      ])
    })))
  )
})
