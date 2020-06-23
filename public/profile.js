/*global m _ comp state look makeModal autoForm updateBoth io*/

_.assign(comp, {
  profile: () => m('.content',
    m('br'), m('h1', 'Profil Pengguna'),
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
    m('.button.is-warning', {
      onclick: () => state.modalProfile = m('.box',
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
            io().emit('passwordCrypt', doc.password, res =>
              updateBoth('users', state.login.id, _.assign(state.login, doc, {password: res}))
            ) : updateBoth('users', state.login.id, _.assign(state.login, doc)),
            state.modalProfile = null, m.redraw()
          ]
        }))
      )
    }, 'Ganti'),
    makeModal('modalProfile')
  )
})