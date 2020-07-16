/*global _ comp m state menus look collNames db gapi dbCall withThis io autoForm schemas moment getDifferences betaMenus ors ands selects randomColor*/

_.assign(comp, {
  navbar: () => m('nav.navbar.is-primary',
    m('.navbar-brand', m('a.navbar-item', {
      onclick: () => state.route = 'dashboard'
    }, "SIMRS.dev")),
    m('.navbar-menu',
      m('.navbar-start', _.map(_.merge(
        {}, menus, localStorage.openBeta ? betaMenus : {}
      ), (val, key) =>
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
    _.chunk(_.map(_.merge(
      {}, menus, localStorage.openBeta ? betaMenus : {}
    ), (v, k) => [v, k]), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('.box', m('article.media',
          {onclick: () => [state.route = j[1], m.redraw()]},
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j[0].icon))
          ),
          m('.media-content', m('.content',m('h3', j[0].full)))
        ))
      )))
    ),
    m('h1', 'Statistik Sistem'),
    localStorage.openBeta && [
      m('.tabs.is-boxed', m('ul',
        {style: 'margin-left: 0%'},
        _.map({
          pasien: ['Pasien', 'walking'],
          rawatJalan: ['Rawat Jalan', 'ambulance'],
          emergency: ['Emergency', 'heart'],
          rawatInap: ['Rawat Inap', 'bed'],
          radiology: ['Radiologi', 'radiation'],
          laboratory: ['Laboratorium', 'flask'],
          manajemen: ['Manajemen', 'people']
        }, (val, key) => m('li',
          {class: key === state.dashboardTab && 'is-active'},
          m('a',
            {onclick: () => [state.dashboardTab = key, m.redraw()]},
            m('span.icon', m('i.fas.fa-'+val[1])),
            m('span', val[0])
          )
        ))
      )),
      m('.columns', ({
        pasien: [
          'Total jumlah pasien: ',
          'Total pasien pria: ',
          'Total pasien wanita: '
        ],
        rawatJalan: selects('klinik')()
        .map(i => 'Total pasien klinik '+i.label+': '),
        emergency: ['Total pasien emergency: '],
        rawatInap: ['Total okupasi bed: '],
        radiology: ['Total layanan radiologi: '],
        laboratory: ['Total layanan laboratorium: '],
        manajemen: [
          'Jumlah petugas: ',
          'Jumlah perawat: ',
          'Jumlah dokter: '
        ]
      })[state.dashboardTab || 'pasien']
      .map(i => m('.column', m('.notification',
        {class: 'is-primary'}, i
      ))))
    ],
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
            _.assign(state, {
              username: doc.username, route: 'dashboard', login: res
            }),
            localStorage.setItem('login', JSON.stringify(res)),
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
  state.login = localStorage.login &&
    JSON.parse(localStorage.login || '{}'),
  m.mount(document.body, {view: () => m('div',
    comp.navbar(), m('.container', m('br'),
      state.username || _.get(state, 'login.username') ?
      comp[state.route]() : comp.login()
    )
  )}),
  // setiap kali data berubah, beritahu server untuk update seluruh klien yg sedang terkoneksi
  io().on('datachange', (name, doc) => [
    db[name].put(doc),
    state.lastSync = +moment()
  ])
])
