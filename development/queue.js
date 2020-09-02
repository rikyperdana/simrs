/*global _ m comp makePdf ands selects insertBoth db startOfTheDay moment*/

_.assign(comp, {
  queue: () => m('.content',
    m('table.is-fullwidth', m('tr',
      {onupdate: () => [
        db.queue.toArray(
          array => localStorage.setItem('regQueue', array.filter(
            i => i.timestamp > startOfTheDay(+moment())
          ).length)
        ),
        db.patients.toArray(array => localStorage.setItem(
          'clinicQueue', JSON.stringify(
            array.flatMap(i => (i.rawatJalan || []).map(j =>
              (startOfTheDay(j.tanggal) === startOfTheDay(_.now())) &&
              [j.klinik, Boolean(j.soapDokter)]
            ).filter(Boolean))
            .filter(i => i.length)
          )
        ))
      ]},
      m('th', m('h1', 'Antrian Pendaftaran')),
      m('th', m('h1', 'R'+(localStorage.regQueue || 0)))
    )),
    m('.buttons',
      m('.button', {
        onclick: () => ands([
          insertBoth('queue', {
            timestamp: +moment(),
            no_antrian: 'R'+(+localStorage.regQueue+1)
          }),
          makePdf.regQueue(+localStorage.regQueue),
          localStorage.setItem('regQueue', +localStorage.regQueue+1)
        ])
      }, 'Cetak antrian'),
      m('.button', {
        onclick: () => localStorage.setItem('regQueue', 0)
      }, 'Reset Antrian')
    ),
    Array(3).map(i => m('br')),
    // TODO: antrian poliklinik belum ada angkanya
    m('table.is-fullwidth.is-striped',
      m('thead', m('tr'), [
        'Antrian Poliklinik', 'Urutan', 'Panjang'
      ].map(i => m('td', m('h1', i)))),
      selects('klinik')().map(i => m('tr',
        [
          i.label,
          JSON.parse(localStorage.clinicQueue || '[]')
          .filter(j => ands([j[0] === i.value, j[1]])).length,
          JSON.parse(localStorage.clinicQueue || '[]')
          .filter(j => j[0] === i.value).length
        ].map(i => m('td', m('h1', i)))
      ))
    )
  )
})
