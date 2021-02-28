/*global _ m comp*/

_.assign(comp, {
  telemed: () => m('.content',
    {onupdate: () => db.patients.toArray(array => [
      state.telemedList = array
        .filter(i => (i.telemed || []).length)
        .filter(i => i.telemed.filter(j => ands([
          !j.soapDokter, j.konfirmasi !== 2
        ])).length),
      m.redraw()
    ])},
    // Kalau buat kredensial pasiennya di pendaftaran
    m('h3', 'Request Telemedic'),
    m('.box', m('.table-container', m('table.table',
      m('thead', m('tr', [
        'Entry', 'Pasien', 'Klinik', 'Dokter', 'Darurat', 'Tanggal'
      ].map(i => m('th', i)))),
      state.telemedList && m('tbody', state.telemedList.map(
        i => i.telemed
        .filter(j => ands([!j.soapDokter, j.konfirmasi !== 2]))
        .map(j => m('tr',
          {onclick: () => [
            state.modalTelemed = ors([
              // konfirmasi ditangani oleh pendaftaran
              ands([
                !j.konfirmasi !== 1,
                state.login.bidang === 1,
                m('.box',
                  m('h4', 'Konfirmasi Telemedik'),
                  m('p', 'Catatan pasien: '+(j.pesan || '-')),
                  m(autoForm({
                    id: 'konfirmasiTelemed',
                    layout: {top: [['konfirmasi', 'tanggal'], ['link'], ['keterangan']]},
                    schema: {
                      konfirmasi: {type: Number, autoform: {
                        type: 'select', options: selects('boolean')
                      }},
                      tanggal: {type: Date, autoform: {type: 'datetime-local'}},
                      link: {type: String, autoform: {help: 'Masukkan link video channel'}},
                      keterangan: {type: String, optional: true, autoform: {type: 'textarea'}}
                    },
                    action: doc => updateBoth(
                      'patients', i._id, _.assign(i, {telemed: i.telemed.map(
                        k => k.idrawat === j.idrawat ? _.assign(k, doc) : k
                      )}),
                      res => res && [state.modalTelemed = null, m.redraw()]
                    )
                  })),
                  m('p.help', m('a', {
                    href: 'https://github.com/rikyperdana/simrs/wiki/Telemedic-Guide',
                    target: '_blank'
                  }, '* Dapatkan link video channel di sini'))
                )
              ]),
              // live stream ditangani oleh dokter
              ands([
                j.konfirmasi === 1,
                state.login.poliklinik,
                state.login.peranan === 3,
                m('.box',
                  m('h4', 'Mulai proses Telemedic'),
                  m('p', 'Catatan pasien: '+(j.pesan || '-')),
                  m('.buttons',
                    m('.button.is-primary',
                      {onclick: () => [
                        _.assign(state, {route: 'onePatient', onePatient: i}),
                        m.redraw()
                      ]},
                      makeIconLabel('book-medical', 'Rekam Medis')
                    ),
                    m('.button.is-warning', m('a',
                      {href: j.link, target: '_blank', style: "color: inherit"},
                      makeIconLabel('headset', 'Mulai Streaming')
                    )),
                    m('.button.is-info',
                      {onclick: () => [
                        _.assign(state, {
                          route: 'formSoap', onePatient: i, oneRawat: j,
                          modalTelemed: null
                        }),
                        m.redraw()
                      ]},
                      makeIconLabel('file-medical', 'Form SOAP')
                    )
                  )
                )
              ])
            ]),
            m.redraw()
          ]},
          tds([
            hari(j.request, true),
            i.identitas.nama_lengkap,
            look('klinik', j.klinik),
            lookUser(j.dokter),
            look('boolean', j.darurat),
            hari(j.tanggal, true)
          ])
        ))
      ))
    ))),
    makeModal('modalTelemed')
  ),
  telemedHistory: () => m('.box',
    m('.table-container', m('table.table',
      m('thead', m('tr', ['Tanggal', 'Dokter'].map(i => m('th', i)))),
      m('tbody', (state.onePatient.telemed || []).map(i => m('tr',
        {onclick: () => [
          state.modalRincianTelemed = m('.box',
            m('h4', 'Rincian Telemed'),
            m('table.table',
              m('tr', m('th', 'Tanggal Konsultasi'), m('td', hari(i.tanggal, true))),
              m('tr', m('th', 'Klinik diminta'), m('td', look('klinik', i.klinik))),
              m('tr', m('th', 'Dokter diminta'), m('td', lookUser(i.dokter))),
              m('tr',
                m('th', 'Dokter Pemeriksa'),
                m('td', lookUser(_.get(i, 'soapDokter.dokter')))
              ),
              makeRincianSoapDokter(i.soapDokter)
            ),
            m('.buttons',
              m('.button.is-info',
                {onclick: () => makePdf.soap(state.onePatient.identitas, i)},
                makeIconLabel('print', 'Cetak SOAP')
              )
            )
          ),
          m.redraw()
        ]},
        tds([hari(i.tanggal, true), lookUser(_.get(i, 'soapDokter.dokter'))])
      )))
    )),
    makeModal('modalRincianTelemed')
  )
})
