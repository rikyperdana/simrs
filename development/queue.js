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
  ),
  queueClinic: () => m('.content',
    {onupdate: () => db.patients.toArray(array => [
      state.queueClinicList = array.filter(i =>
        (i.rawatJalan || []).filter(j => ands([
          ors([j.bayar_pendaftaran, j.cara_bayar !== 1]),
          !j.soapPerawat, j.tanggal > startOfTheDay(_.now())
        ])).length
      ), m.redraw()
    ])},
    m('h1', 'Antrian Seluruh Poliklinik'),
    selects('klinik')().map(i => [
      m('h2', i.label),
      m('.box', m('.table-container', m('table.table.is-striped',
        m('thead', m('th', 'Nama Pasien')),
        m('tbody', (state.queueClinicList || []).map(j =>
          !(j.rawatJalan || []).filter(k => ands([
            ors([k.bayar_pendaftaran, k.cara_bayar !== 1]),
            k.klinik === i.value, !k.soapPerawat,
            k.tanggal > startOfTheDay(_.now())
          ])).length ? null :
          m('tr', m('td', j.identitas.nama_lengkap))
        ))
      )))
    ])
  )
})
