/*global _ comp m state menus look collNames db gapi dbCall withThis io autoForm schemas moment getDifferences betaMenus ors ands selects randomColor*/

var {laboratory, radiology} = betaMenus
_.assign(comp, {
  navbar: () => m('nav.navbar.is-primary',
    m('.navbar-brand', m('a.navbar-item', {
      onclick: () => state.route = 'dashboard'
    }, "SIMRS.dev")),
    m('.navbar-menu',
      m('.navbar-start', _.map(_.merge(
        {}, menus, localStorage.openBeta ?
        {laboratory, radiology} : {}
      ), (val, key) =>
        m('a.navbar-item',
          {
            class: val.children && 'has-dropdown is-hoverable',
            onclick: () => state.route = key
          },
          val.children ? [
            m('a.navbar-link', _.startCase(val.full)),
            m('.navbar-dropdown', _.map(val.children, (i, j) =>
              m('a.navbar-item',
                {onclick: e => [e.stopPropagation(), state.route = j]},
                m('span.icon', m('i.fas.fa-'+i.icon)),
                m('span', i.full)
               )
            ))
          ] : m('span', _.startCase(val.full))
        )
      )),
      m('.navbar-end', m('.navbar-item.has-dropdown.is-hoverable',
        m('a.navbar-link', {
          onclick: () => [state.route = 'profile', m.redraw()]
        }, _.get(state.login, 'username')),
        m('.navbar-dropdown.is-right',
          m('a.navbar-item',
            m('span.icon', m('i.fas.fa-user-tag')),
            m('span', 'Peranan: '+ look('peranan', _.get(state.login, 'peranan')))
          ),
          m('a.navbar-item',
            m('span.icon', m('i.fas.fa-shapes')),
            m('span', 'Bidang: '+look('bidang', _.get(state.login, 'bidang')))
          ),
          m('a.navbar-item',
            m('span.icon', m('i.fas.fa-clinic-medical')),
            m('span', 'Poliklinik: '+look('klinik', _.get(state.login, 'poliklinik')))
          ),
          m('hr.dropdown-divider'),
          m('a.navbar-item',
            {onclick: () => [
              _.assign(state, {login: null, route: 'login', loading: false}),
              localStorage.removeItem('login'),
              m.redraw()
            ]},
            m('span.icon', m('i.fas.fa-sign-out-alt')),
            m('span', 'Logout')
          )
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
        "data-tooltip": 'otomatis setiap beberapa menit / manual',
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
    localStorage.openBeta && [
      m('h1', 'Statistik Sistem'),
      m('.tabs.is-boxed', m('ul',
        {style: 'margin-left: 0%'},
        _.map({
          pasien: ['Pasien', 'walking'],
          rawatJalan: ['Rawat Jalan', 'ambulance'],
          emergency: ['Emergency', 'heart'],
          rawatInap: ['Rawat Inap', 'bed'],
          radiology: ['Radiologi', 'radiation'],
          laboratory: ['Laboratorium', 'flask'],
          manajemen: ['Manajemen', 'users']
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
      !window.chrome && m('.notification.is-warning.is-light',
        'Mohon gunakan Chrome versi terbaru'
      ),
      state.error && m('.notification.is-danger.is-light', [
        m('button.delete', {onclick: () => state.error = false}),
        state.error
      ]),
      _.range(3).map(() => m('br')),
      m('.level', m('.level-item.has-text-centered',
        m('span.icon.is-large.has-text-primary', m('i.fas.fa-8x.fa-stethoscope'))
      )), m('br'),
      m(autoForm({
        id: 'login', schema: schemas.login,
        submit: {
          value: 'Login',
          class: state.loading ? 'is-info is-loading' : 'is-info'
        },
        action: doc => [
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

io().on('connect', socket => [
  state.login = localStorage.login &&
    JSON.parse(localStorage.login || '{}'),
  m.mount(document.body, {view: () => m('.has-background-light',
    comp.navbar(), m('.container',
      {style: 'min-height:100vh'}, m('br'),
      state.username || _.get(state, 'login.username') ?
      comp[state.route]() : comp.login()
    ),
    m('footer.footer',
      {style: 'padding:0px'},
      m('.content', m('a', {
        href: 'https://github.com/rikyperdana/simrs',
        target: '_blank'
      }, 'Versi 5.4'))
    )
  )}),
  // setiap kali data berubah, beritahu server untuk update seluruh klien yg sedang terkoneksi
  io().on('datachange', (name, doc) => [
    db[name].put(doc), state.lastSync = _.now()
  ])
])