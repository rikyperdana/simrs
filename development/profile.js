/*global m _ comp state look makeModal autoForm updateBoth io makeIconLabel*/

_.assign(comp, {
  profile: () => m('.content',
    m('h1', 'Profil Pengguna'),
    m('.columns',
      m('.column', m('.box', m('table.table.is-striped', m('tbody',
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
      )))),
      m('.column', m('.buttons',
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
        m('a.button.is-link',
          {
            href: 'https://www.youtube.com/watch?v=irSxnKSRIOI&list=PL4oE8OvUySlyfGzQTu8kN9sPWWfcn_wSZ',
            target: '_blank'
          },
          makeIconLabel('chalkboard-teacher', 'Tutorial')
        ),
        m('a.button.is-danger',
          {onclick: () => [
            state.modalLicense = m('.box',
              m('h3', 'Unlock Lisensi Enterprise'),
              m('p.help', 'Untuk menghilangkan semua garis batas pada pdf'),
              m(autoForm({
                id: 'updateLicense',
                schema: {key: {type: String, autoform: {
                  placeholder: 'Dapatkan dari developer'
                }}},
                action: ({key}) => key.length === 15 && [
                  withThis(['license', key.split(' ').reverse().join(''), localStorage],
                  name => _.last(name).setItem(_.first(name), +(name[+true]+'e5'))),
                  state.modalLicense = null,
                  m.redraw()
                ]
              }))
            ),
            m.redraw()
          ]},
          makeIconLabel('key', 'Unlock')
        ),
        m('a.button.is-dark',
          {onclick: () => state.modalThemeSelect = m('.box',
            m('h3', 'Ganti Tema SIMRS'),
            m('a', {
              href: 'https://jenil.github.io/bulmaswatch/',
              target: '_blank'
            }, 'Lihat galeri pilihan tema'),
            m('p', 'Tema saat ini: ' + _.startCase(localStorage.bulmaTheme)),
            m(autoForm({
              id: 'themeSelect',
              schema: {theme: {
                type: String, autoform: {
                  type: 'select', options: () => [
                    'default', 'cerulean', 'cosmo', 'cyborg', 'darkly',
                    'flatly', 'journal', 'litera', 'lumen', 'lux',
                    'materia', 'minty', 'nuclear', 'pulse', 'sandstone',
                    'simplex', 'slate', 'solar', 'spacelab', 'superhero',
                    'united', 'yeti'
                  ].map(i => ({value: i, label: _.startCase(i)}))
                }
              }},
              action: doc => [
                localStorage.setItem('bulmaTheme', doc.theme),
                state.modalThemeSelect = null,
                m.redraw()
              ]
            }))
          )},
          makeIconLabel('palette', 'Ganti Tema')
        )
      ))
    ),
    makeModal('modalProfile'),
    makeModal('modalLicense'),
    makeModal('modalThemeSelect')
  )
})
