/*global _ comp m state menus look collNames db gapi dbCall withThis io autoForm schemas moment getDifferences betaMenus ors ands selects randomColor makeIconLabel*/

var topMenus = _.omit(menus, ['cssd', 'gizi'])
_.assign(comp, {
  navbar: () => m('nav.navbar.is-primary.is-fixed-top',
    m('.navbar-brand',
      m('a.navbar-item',
        {onclick: () => state.route = 'dashboard'},
        "SIMRS.dev"
      ),
      m('.navbar-burger',
        {
          role: 'button', class: state.burgerMenu && 'is-active',
          onclick: () => state.burgerMenu = !state.burgerMenu
        },
        _.range(3).map(i => m('span', {'aria-hidden': true}))
      )
    ),
    m('.navbar-menu',
      {class: state.burgerMenu && 'is-active'},
      m('.navbar-start', _.map(topMenus, (val, key) =>
        m('a.navbar-item',
          {
            class: val.children && 'has-dropdown is-hoverable',
            onclick: () => [_.assign(state, {
              route: key, burgerMenu: null
            }), m.redraw()]
          },
          val.children ? [
            m('a.navbar-link', _.startCase(val.full)),
            m('.navbar-dropdown', _.map(val.children, (i, j) =>
              m('a.navbar-item',
                {onclick: e => [
                  e.stopPropagation(), _.assign(state, {
                    route: j, burgerMenu: null
                  })
                ]},
                makeIconLabel(i.icon, i.full)
               )
            ))
          ] : m('span', _.startCase(val.full))
        )
      )),
      state.login &&
      m('.navbar-end', m('.navbar-item.has-dropdown.is-hoverable',
        m('a.navbar-link', {
          onclick: () => [state.route = 'profile', m.redraw()]
        }, _.get(state.login, 'username')),
        m('.navbar-dropdown.is-right',
          m('a.navbar-item',
            makeIconLabel('user-tag', 'Peranan: '+ look('peranan', _.get(state.login, 'peranan')))
          ),
          m('a.navbar-item',
            makeIconLabel('shapes', 'Bidang: '+look('bidang', _.get(state.login, 'bidang')))
          ),
          m('a.navbar-item',
            makeIconLabel('clinic-medical', 'Poliklinik: '+look('klinik', _.get(state.login, 'poliklinik')))
          ),
          m('hr.dropdown-divider'),
          m('a.navbar-item',
            {onclick: () => [
              _.assign(state, {
                login: null, route: 'login', loading: false,
                burgerMenu: null
              }),
              localStorage.removeItem('login'),
              m.redraw()
            ]},
            makeIconLabel('sign-out-alt', 'Logout')
          )
        )
      ))
    )
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
        class: state.loading ? 'is-loading' : '',
        "data-tooltip": 'otomatis setiap beberapa menit / manual',
        onclick: () => [state.loading = true, getDifferences()]
      }, 'Sync'),
      state.lastSync && m('span',
        'Tersinkronisasi ' + moment(state.lastSync).fromNow()
      ),
    ),
    _.chunk(_.map(menus, (v, k) => [v, k]), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('a.box', m('article.media',
          {onclick: () => [state.route = j[1], m.redraw()]},
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j[0].icon))
          ),
          m('.media-content', m('.content',m('h3', j[0].full)))
        ))
      )))
    ),
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
        storage: ['Gudang', 'cubes'],
        management: ['Management', 'users']
      }, (val, key) => m('li',
        {class: key === state.dashboardTab && 'is-active'},
        m('a',
          {onclick: () => [state.dashboardTab = key, m.redraw()]},
          makeIconLabel(val[1], val[0])
        )
      ))
    )),
    m('.columns', {
      oncreate: () => [
        db.patients.toArray(array => _.merge(state, {stats: {
          pasien: {
            total: array.length,
            pria: array.filter(i => i.identitas.kelamin === 1).length,
            wanita: array.filter(i => i.identitas.kelamin === 2).length
          },
          rawatJalan: selects('klinik')().map(
            i => _.sum(array.map(
              j => (j.rawatJalan || []).filter(
                k => k.klinik === i.value
              ).length
            ).filter(Boolean))
          ),
          emergency: _.sum(array.map(i => (i.emergency || []).length)),
          rawatInap: _.sum(array.map(i => (i.rawatInap || []).length)),
          radiology: _.flattenDeep(array.map(i => [
            ...i.rawatJalan || [],
            ...i.emergency || [],
            ...(i.rawatInap || []).flatMap(i => i.observasi) || []
          ].map(j => _.get(j, 'soapDokter.radio')).filter(Boolean))).length,
          laboratory: _.flattenDeep(array.map(i => [
            ...i.rawatJalan || [],
            ...i.emergency || [],
            ...(i.rawatInap || []).flatMap(i => i.observasi) || []
          ].map(j => _.get(j, 'soapDokter.labor')).filter(Boolean))).length
        }})),
        db.goods.toArray(array => _.merge(state, {stats: {
          barang: {
            obat: array.filter(i => i.jenis === 1).length,
            bhp: array.filter(i => i.jenis === 2).length,
            batch: array.flatMap(i => i.batch).length
          }
        }})),
        db.users.toArray(array => _.merge(state, {stats: {
          management: {
            petugas: array.filter(i => i.peranan === 1).length,
            perawat: array.filter(i => i.peranan === 2).length,
            dokter: array.filter(i => i.peranan === 3).length,
            admin: array.filter(i => i.peranan === 4).length
          }
        }}))
      ]
    }, ({
      pasien: [
        'Total jumlah pasien: '+_.get(state, 'stats.pasien.total'),
        'Total pasien pria: '+_.get(state, 'stats.pasien.pria'),
        'Total pasien wanita: '+_.get(state, 'stats.pasien.wanita')
      ],
      rawatJalan: selects('klinik')().map(i => [
        'Total pasien klinik ', i.label, ': ',
        _.get(state, ['stats', 'rawatJalan', i.value-1])
      ].join('')),
      emergency: ['Total pasien emergency: '+_.get(state, 'stats.emergency')],
      rawatInap: ['Total pasien pernah inap: '+_.get(state, 'stats.rawatInap') ],
      radiology: ['Total riwayat layanan radiologi: '+_.get(state, 'stats.radiology')],
      laboratory: ['Total riwayat layanan laboratorium: '+_.get(state, 'stats.laboratory')],
      storage: [
        'Jumlah obat terdaftar: '+_.get(state, 'stats.barang.obat'),
        'Jumlah BHP terdaftar: '+_.get(state, 'stats.barang.bhp'),
        'Jumlah batch terdaftar: '+_.get(state, 'stats.barang.batch')
      ],
      management: [
        'Jumlah petugas: '+_.get(state, 'stats.management.petugas'),
        'Jumlah perawat: '+_.get(state, 'stats.management.perawat'),
        'Jumlah dokter: '+_.get(state, 'stats.management.dokter')
      ]
    })[state.dashboardTab || 'pasien']
    .map(i => m('.column', m('.notification',
      {class: 'is-primary'}, i
    ))))
  ),

  login: () => m('.content', m('.columns',
    m('.column'),
    m('.column',
      !ors([
        window.chrome, typeof(InstallTrigger) === 'object'
      ]) && m('.notification.is-warning.is-light',
        'Mohon gunakan Chrome/Firefox terbaru'
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
            state.error = null, m.redraw()
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
  m.mount(document.body, {view: () => m('div',
    {class: ors([
      _.includes([
        // semua latar terang diberi background grey
        'default', 'cerulean', 'cosmo', 'flatly',
        'journal', 'litera', 'lumen', 'lux',
        'materia', 'pulse', 'sandstone', 'simplex',
        'spacelab', 'united', 'yeti'
      ], localStorage.bulmaTheme),
      !Boolean(localStorage.bulmaTheme)
    ]) && 'has-background-light'},
    comp.navbar(), m('section.section', m('.container',
      {style: 'min-height:100vh'},
      state.username || _.get(state, 'login.username') ?
      comp[state.route]() : comp.login()
    )),
    m('footer.footer',
      {style: 'padding:0px'},
      m('.content', m('a.help.has-text-grey', {
        href: 'https://github.com/rikyperdana/simrs',
        target: '_blank',
        style: 'text-align:center'
      }, 'Hak Cipta: SIMRS.dev (2019); Versi 3.3.7'))
    ),
    localStorage.bulmaTheme &&
    m('link', {rel: 'stylesheet', href:'https://unpkg.com/bulmaswatch/'+localStorage.bulmaTheme+'/bulmaswatch.min.css'})
  )}),
  // setiap kali data berubah, beritahu server untuk update seluruh klien yg sedang terkoneksi
  io().on('datachange', (name, doc) => [
    db[name].put(doc), state.lastSync = _.now()
  ]),
  // jika koneksi sempat terputus, langsung reload halaman
  io().on('disconnect', () => location.reload())
])
