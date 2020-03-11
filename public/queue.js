/*global _ m comp makePdf ands selects*/

_.assign(comp, {
  queue: () => m('.content',
    m('table.is-fullwidth.is-striped', m('tr',
      m('th', m('h1', 'Antrian Pendaftaran')),
      m('th', m('h1', 'R'+(localStorage.regQueue || 0)))
    )),
    m('.buttons',
      m('.button', {
        onclick: () => ands([
          makePdf.regQueue(+localStorage.regQueue),
          localStorage.setItem('regQueue', (+localStorage.regQueue)+1)
        ])
      }, 'Cetak antrian'),
      m('.button', {
        onclick: () => localStorage.setItem('regQueue', 0)
      }, 'Reset Antrian')
    ),
    Array(3).map(i => m('br')),
    m('h1', 'Antrian Poliklinik'),
    m('table.is-fullwidth',
      selects('klinik')().map(i => m('tr',
        m('td', m('h2', i.label))
      ))
    )
  )
})