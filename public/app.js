/*global _ comp m state menus look collNames db gapi dbCall withThis io autoForm schemas moment*/

var
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
              m('a.navbar-item', {onclick: (e) =>
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
        submit: {value: 'Login', class: state.loading ? 'is-info is-loading' : 'is-info'},
        action: (doc) => [
          state.loading = true, m.redraw(),
          io().emit('login', doc, ({res}) => res ? [
            _.assign(state, {username: doc.username, route: 'dashboard'}),
            db.users.filter(i => i.username === state.username)
            .toArray(i => [state.login = i[0], m.redraw()]),
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
  m.mount(document.body, {view: () => m('div',
    comp.navbar(), m('.container', m('br'),
      state.username ? comp[state.route]() : comp.login()
    )
  )}),
  io().on('datachange', name => getDifference(name))
])