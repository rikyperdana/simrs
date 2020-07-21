/*global _ comp m db state hari look ands ors lookUser makeModal updateBoth autoForm schemas makePdf makeReport withThis tds moment reports*/

_.assign(comp, {
  emergency: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    {onupdate: () =>
      db.patients.toArray(array =>
        state.emergencyList = array.filter(i =>
          i.emergency && i.emergency.filter(j =>
            !j.soapDokter
          ).length > 0
        )
      )
    },
    reports.igd(),
    m('h3', 'Unit Gawat Darurat'),
    m('table.table',
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.emergencyList &&
        state.emergencyList.map(i => m('tr',
          {ondblclick: () => [
            _.assign(state, {
              route: 'onePatient', onePatient: i, onePatientTab: 'emergency'
            }),
            m.redraw()
          ]},
          m('td', i.identitas.no_mr),
          m('td', i.identitas.nama_lengkap)
        ))
      )
    )
  ),
  emergencyHistory: () => m('.content',
    m('table.table',
      m('thead', m('tr',
        ['Tanggal berobat', 'Cara bayar', 'Perawat', 'Dokter']
        .map(i => m('th', i))
      )),
      m('tbody',
        (_.get(state, 'onePatient.emergency') || [])
        .map(i => m('tr',
          {onclick: () =>
            state.modalVisit = m('.box',
              m('h4', 'Rincian kunjungan'),
              m('table.table',
                m('tr', m('th', 'Tanggal berobat'), m('td', hari(i.tanggal))),
                m('tr', m('th', 'Cara bayar'), m('td', look('cara_bayar', i.cara_bayar))),
                m('tr', m('th', 'Perawat'), m('td', lookUser(_.get(i, 'soapPerawat.perawat')))),
                m('tr', m('th', 'Dokter'), m('td', lookUser(_.get(i, 'soapDokter.dokter')))),
                i.soapPerawat && [
                  m('tr', m('th', 'Anamnesa Perawat'), m('td', i.soapPerawat.anamnesa)),
                  i.soapPerawat.tekanan_darah &&
                  m('tr', m('th', 'Tekanan darah'), m('td', i.soapPerawat.tekanan_darah))
                ],
                i.soapDokter && [
                  m('tr', m('th', 'Anamnesa Dokter'), m('td', i.soapDokter.anamnesa)),
                  _.map(i.soapDokter.diagnosa, (j, k) =>
                    m('tr', m('th', 'Diagnosa '+k), m('td', j.text+' / ICD X: '+(j.icd10 || '?')))
                  )
                ],
              ),
              m('p.buttons',
                ands([
                  state.login.peranan !== 1,
                  ors([
                    state.login.peranan === 2 && !i.soapPerawat,
                    state.login.peranan === 3 && !i.soapDokter,
                  ]),
                  m('.button.is-success',
                    {onclick: () => _.assign(state, {
                      route: 'formSoap', oneRawat: i, modalVisit: null
                    })},
                    m('span.icon', m('i.fas.fa-user-md')),
                    m('span',
                      state.login.peranan === 3 ?
                      'Soap Dokter' : 'Soap Perawat'
                    )
                  ),
                ]),
                m('.button.is-info',
                  {onclick: () => makePdf.soap(state.onePatient.identitas, i)},
                  m('span.icon', m('i.fas.fa-print')),
                  m('span', 'Cetak SOAP')
                )
              )
            )
          },
          tds([
            hari(i.tanggal),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
        ))
      )
    ),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'igdVisit'},
      m('span.icon', m('i.fas.fa-file-invoice')),
      m('span', 'Kunjungi IGD')
    ),
    makeModal('modalVisit')
  ),
  igdVisit: () => m('.content',
    m('h3', 'Form pendaftaran IGD'),
    m('.box', m(autoForm({
      id: 'igdVisit', autoReset: true,
      schema: _.omit(schemas.rawatJalan, 'klinik'),
      action: doc => [
        updateBoth('patients', state.onePatient._id, _.assign(
          state.onePatient, {emergency:
            (_.get(state, 'onePatient.emergency') || []).concat([doc])
          }
        )),
        state.route = 'onePatient',
        m.redraw()
      ]
    })))
  )
})
