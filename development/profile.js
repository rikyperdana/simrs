/*global m _ comp state look makeModal autoForm updateBoth io makeIconLabel*/

_.assign(comp, {
  profile: () => m('.content',
    m('h1', 'Profil Pengguna'),
    m('table.table', m('tbody',
      m('tr',
        m('th', 'Username'),
        m('td', state.login.username)
      ),
      m('tr',
        m('th', 'Password'),
        m('td', '*************'),
      ),
      m('tr',
        m('th', 'Nama Lengkap'),
        m('td', state.login.nama)
      ),
      m('tr',
        m('th', 'Bidang'),
        m('td', look('bidang', state.login.bidang))
      ),
      m('tr',
        m('th', 'Peranan'),
        m('td', look('peranan', state.login.peranan))
      )
    )),
    m('.buttons',
      m('.button.is-warning',
        {onclick: () => state.modalProfile = m('.box',
          m(autoForm({
            id: 'formProfile',
            schema: {
              username: {
                type: String, optional: true,
                autoform: {
                  placeholder: 'Bila tidak ingin diganti, kosongkan saja'
                }
              },
              password: {type: String, optional: true, autoform: {
                type: 'password',
                placeholder: 'Bila tidak ingin diganti, kosongkan saja'
              }},
              nama: {type: String, optional: true, label: 'Nama Lengkap', autoform: {
                placeholder: 'Bila tidak ingin diganti, kosongkan saja'
              }}
            },
            action: doc => [
              doc.password ?
              io().emit('bcrypt', doc.password, res => updateBoth(
                'users', state.login._id, _.assign(state.login, doc, {password: res})
              )) : updateBoth('users', state.login._id, _.assign(state.login, doc)),
              state.modalProfile = null, m.redraw()
            ]
          }))
        )},
        makeIconLabel('edit', 'Update akun')
      ),
      m('a.button.is-info',
        {
          href: 'https://wa.me/628117696000?text=simrs.dev',
          target: '_blank'
        },
        makeIconLabel('envelope-open-text', 'Kritik/Saran')
       ),
      m('a.button.is-danger',
        {
          "data-tooltip": 'Double-click untuk buka/tutup menu beta (radiologi & laboratorium)',
          ondblclick: () =>
            localStorage.openBeta ?
            localStorage.removeItem('openBeta')
            : localStorage.setItem('openBeta', true)
        },
        makeIconLabel('adjust', 'Versi Beta')
      ),
      m('a.button.is-link',
        {
          href: 'https://www.youtube.com/watch?v=irSxnKSRIOI&list=PL4oE8OvUySlyfGzQTu8kN9sPWWfcn_wSZ',
          target: '_blank'
        },
        makeIconLabel('chalkboard-teacher', 'Tutorial')
      )
    ),
    makeModal('modalProfile')
  )
})