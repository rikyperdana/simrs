/*global _ m comp tds state db withThis hari lookUser makeModal*/

_.assign(comp, {
  gizi: () => state.login.bidang !== 10
  ? m('p', 'Hanya untuk user bidang Gizi')
  : m('.content',
    m('h1', 'Daftar konsumsi pasien inap'),
    m('.box', m('.table-container', m('table.table.is-striped',
      {oncreate: () => db.patients.filter(
        i => (i.rawatInap || []).filter(
          j => j.observasi && !j.keluar
        ).length
      ).toArray(array => [
        state.consumeList = array,
        m.redraw()
      ])},
      m('thead', m('tr',
        m('th', 'Nama Pasien'),
        m('th', 'Tanggal Masuk')
      )),
      m('tbody', (state.consumeList || []).map(
        i => m('tr', {onclick: () => [
          state.modalConsume = m('.box',
            m('h3', 'Rincian kebutuhan gizi'),
            m('table.table',
              m('tr',
                m('th', 'Nama Pasien'),
                m('td', i.identitas.nama_lengkap)
              ),
              withThis(_.last(i.rawatInap), inap => [
                m('tr',
                  m('th', 'Tanggal masuk'),
                  m('td', hari(inap.tanggal_masuk, true))
                ),
                m('tr', m('th', 'Kelas/Kamar/Bed'), m('td', [
                  _.upperCase(inap.bed.kelas),
                  _.startCase(inap.bed.kamar),
                  inap.bed.nomor
                ].join('/'))),
                inap.observasi.map(j => j.konsumsi && m('tr', tds([
                  hari(j.tanggal, true),
                  [lookUser(j.dokter), j.konsumsi].join(': ')
                ])))
              ]),
            )
          )
        ]}, tds([
          i.identitas.nama_lengkap,
          hari(_.get(_.last(i.rawatInap), 'tanggal_masuk'), true)
        ]))
      ))
    ))),
    makeModal('modalConsume')
  )
})
