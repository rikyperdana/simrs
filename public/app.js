/*global _ comp m state menus look collNames db gapi dbCall withThis io*/

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
        m('a.navbar-link', _.get(state.login, 'gmail')),
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
          m('a.navbar-item', {
            href: 'https://mail.google.com/mail/logout?hl=en'
          },'Logout')
        )
      ))
    ),
  ),

  dashboard: () => m('.content',
    {oncreate: () => [
      collNames.map(name =>
        db[name].toArray(array =>
          dbCall({
            method: 'getDifference', collection: name,
            clientColl: array.map(i =>
              _.pick(i, ['_id', 'updated'])
            )
          }, res => [
            db[name].bulkPut(res),
            m.redraw()
          ])
        )
      ),
      db.users.filter(i => i.gmail === state.gmail)
      .toArray(i => [state.login = i[0], m.redraw()]),
      db.users.toArray(array =>
        state.userList = array
      )
    ]},
    m('h1', 'Dashboard'),
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
})

window.addEventListener('load', () =>
  gapi.load('auth2', () => withThis(
    gapi.auth2.init({
      client_id: '706941787203-1121t4j0h6gjdd6lje0biaub35cjjn21.apps.googleusercontent.com',
      scope: 'profile' // change client_id value to your own
    }),
    auth2 => auth2.signIn().then(() => [
      state.gmail = Object.values(auth2.currentUser.get().getBasicProfile())
        .find(i => _.includes(i, "@gmail.com")), // Google may change this without prior notice
      m.render(document.body, 'memverifikasi hak akses...'),
      io().on('connect', () =>
        io().emit('isMember', state.gmail, res =>
          m.mount(document.body, {view: () => m('div',
            comp.navbar(), m('.container', m('br'), comp[state.route]())
          )})
        )
      )
    ])
  ))
)