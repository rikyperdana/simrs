/*global _ comp m db state hari look ands ors lookUser makeModal updateBoth autoForm schemas makePdf makeReport withThis tds moment reports makeIconLabel makeRincianSoapPerawat makeRincianSoapDokter layouts*/

_.assign(comp, {
  emergency: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    {onupdate: () => [
      state.loading = true,
      db.patients.toArray(array => [
        state.emergencyList = array.filter(i =>
          i.emergency && i.emergency.filter(j =>
            !j.soapDokter
          ).length > 0
        ),
        state.loading = false, m.redraw()
      ])
    ]},
    m('h3', 'Unit Gawat Darurat'),
    state.loading && m('progress.progress.is-small.is-primary'),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Jam Masuk']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.emergencyList && state.emergencyList
        .sort((a, b) => withThis(
          obj => _.get(_.last(obj.emergency), 'tanggal'),
          lastDate => lastDate(a) - lastDate(b)
        ))
        .map(i => m('tr',
          {onclick: () => [
            _.assign(state, {
              route: 'onePatient', onePatient: i, onePatientTab: 'emergency'
            }),
            m.redraw()
          ]},
          tds([
            i.identitas.no_mr,
            i.identitas.nama_lengkap,
            hari(_.get(_.last(i.emergency), 'tanggal'), true)
          ])
        ))
      )
    ))
  ),

  emergencyHistory: () => m('.content',
    m('.box', m('.table-container', m('table.table',
      m('thead', m('tr',
        ['Tanggal berobat', 'Cara bayar', 'Perawat', 'Dokter']
        .map(i => m('th', i)),
        state.login.peranan === 4 && m('th', 'Hapus')
      )),
      m('tbody',
        (_.get(state, 'onePatient.emergency') || [])
        .map(i => m('tr',
          {onclick: () =>
            state.modalVisit = m('.box',
              m('h4', 'Rincian kunjungan IGD'),
              m('table.table',
                m('tr', m('th', 'Tanggal berobat'), m('td', hari(i.tanggal))),
                m('tr', m('th', 'Cara bayar'), m('td', look('cara_bayar', i.cara_bayar))),
                m('tr', m('th', 'Perawat'), m('td', lookUser(_.get(i, 'soapPerawat.perawat')))),
                m('tr', m('th', 'Dokter'), m('td', lookUser(_.get(i, 'soapDokter.dokter')))),
                makeRincianSoapPerawat(i.soapPerawat),
                makeRincianSoapDokter(i.soapDokter)
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
                    makeIconLabel(
                      'user-md',
                      state.login.peranan === 3 ?
                      'Soap Dokter' : 'Soap Perawat'
                    )
                  )
                ]),
                m('.button.is-info',
                  {onclick: () => makePdf.soap(state.onePatient.identitas, i)},
                  makeIconLabel('print', 'Cetak SOAP')
                )
              )
            )
          },
          tds([
            hari(i.tanggal, true),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
          ands([
            state.login.peranan === 4,
            !i.bayar_konsultasi
          ]) && m('td', m('.button.is-danger', {
            onclick: e => [
              e.stopPropagation(),
              confirm('Yakin hapus riwayat IGD?') &&
              updateBoth('patients', state.onePatient._id, _.assign(
                state.onePatient, {emergency:
                  state.onePatient.emergency.filter(j =>
                    j.idrawat !== i.idrawat
                  )
                }
              ))
            ]
          }, makeIconLabel('trash-alt', 'Hapus')))
        ))
      )
    ))),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'igdVisit'},
      makeIconLabel('file-invoice', 'Kunjungi IGD')
    ),
    makeModal('modalVisit')
  ),

  igdVisit: () => m('.content',
    m('h3', 'Form pendaftaran IGD'),
    m('.box', m(autoForm({
      id: 'igdVisit', autoReset: true,
      schema: _.omit(schemas.rawatJalan, 'klinik'),
      layout: layouts.igdVisit,
      confirmMessage: 'Yakin untuk mendaftarkan pasien ke IGD?',
      action: doc => [
        updateBoth('patients', state.onePatient._id, _.assign(
          state.onePatient, {emergency: [
            ...(_.get(state, 'onePatient.emergency') || []), doc
          ]}
        )),
        state.route = 'onePatient',
        m.redraw()
      ]
    })))
  )
})
