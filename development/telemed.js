/*global _ m comp*/

_.assign(comp, {
  telemed: () => m('.content',
    {onupdate: () => db.patients.toArray(array => [
      state.telemedList = array
        .filter(i => (i.telemed || []).length)
        .filter(i => i.telemed.filter(j => !j.soapDokter).length),
      m.redraw()
    ])},
    // Kalau buat kredensial pasiennya di pendaftaran
    m('h3', 'Request Telemedic'),
    m('.box', m('.table-container', m('table.table',
      m('thead', m('tr', ['Entry', 'Pasien', 'Klinik', 'Dokter', 'Darurat', 'Jadwal'].map(i => m('th', i)))),
      state.telemedList && m('tbody', state.telemedList.map(
        i => i.telemed.map(j => m('tr',
          {onclick: () => [
            state.modalTelemed = j.konfirmasi === 1 ?
            m('.box',
              m('h4', 'Mulai proses Telemedic'),
              m('.buttons',
                m('.button.is-primary',
                  makeIconLabel('book-medical', 'Rekam Medis')
                ),
                m('.button.is-warning',
                  makeIconLabel('headset', 'Mulai Streaming')
                ),
                m('.button.is-info',
                  makeIconLabel('file-medical', 'Form SOAP')
                )
              )
            )
            : m('.box',
              m('h4', 'Konfirmasi Telemedik'),
              m(autoForm({
                id: 'konfirmasiTelemed',
                layout: {top: [['konfirmasi', 'jadwal'], ['link'], ['keterangan']]},
                schema: {
                  konfirmasi: {type: Number, autoform: {
                    type: 'select', options: selects('boolean')
                  }},
                  jadwal: {type: Date, autoform: {type: 'datetime-local'}},
                  link: {type: String, autoform: {help: 'Masukkan link video channel'}},
                  keterangan: {type: String, autoform: {type: 'textarea'}}
                },
                action: doc => updateBoth(
                  'patients', i._id, _.assign(i, {telemed: i.telemed.map(
                    k => k.idrawat === j.idrawat && _.assign(k, doc)
                  )}),
                  res => res && [state.modalTelemed = null, m.redraw()]
                )
              })),
              m('p.help', m('a', {
                href: 'https://github.com/rikyperdana/simrs/wiki/Telemedic-Guide',
                target: '_blank'
              }, '* Dapatkan link video channel di sini'))
            ),
            m.redraw()
          ]},
          tds([
            hari(j.request, true),
            i.identitas.nama_lengkap,
            look('klinik', j.klinik),
            lookUser(j.dokter),
            look('boolean', j.darurat),
            hari(j.jadwal, true)
          ])
        ))
      ))
    ))),
    makeModal('modalTelemed')
  )
})
