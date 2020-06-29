/*global _ m comp db state ands updateBoth randomId look hari makeModal lookUser lookReferences lookGoods selects makePdf makeReport withThis tds rupiah autoForm moment*/

_.assign(comp, {
  inpatient: () => !_.includes([2, 3, 4], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',

    state.login.peranan === 4 &&
    makeReport('Kunjungan Rawat Inap', e => withThis(
      {
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      },
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Kunjungan Rawat Inap',
          [['Tanggal', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter']]
          .concat(_.compact(
            array.flatMap(pasien =>
              pasien.rawatInap &&
              pasien.rawatInap.map(rawat =>
                _.every([
                  rawat.keluar,
                  rawat.tanggal_masuk > date.start &&
                  rawat.tanggal_masuk < date.end
                ]) && [
                  hari(rawat.tanggal_masuk),
                  pasien.identitas.no_mr.toString(),
                  pasien.identitas.nama_lengkap,
                  rawat.observasi.map(i =>
                    lookUser(i.perawat)
                  ).join(', '),
                  rawat.observasi.map(i =>
                    lookUser(i.dokter)
                  ).join(', ')
                ]
              )
            ).sort((a, b) => a.tanggal - b.tanggal)
          ))
        ))
      ]
    )),

    m('h3', 'Daftar Admisi Rawat Inap'),
    m('table.table',
      {onupdate: () =>
        db.patients.toArray(array =>
          state.admissionList = _.compact(array.flatMap(i =>
            ([]).concat(i.rawatJalan || [], i.emergency || [])
            .flatMap(j => ands([
              _.get(j, 'soapDokter.keluar') === 3,
              (i.rawatInap || []).filter(k =>
                k.idrawat === j.idrawat
              ).length === 0,
              {pasien: i, inap: j}
            ]))
          ))
        )
      },
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Tanggal admisi']
        .map(i => m('th', i))
      )),
      m('tbody', (state.admissionList || [])
      .reverse().map(i => m('tr',
        {ondblclick: () => [
          state.admissionModal = m('.box',
            m('h4', 'Inapkan pasien'),
            m('table.table',
              [
                ['Nama Lengkap', i.pasien.identitas.no_mr],
                ['Cara bayar', look('cara_bayar', i.inap.cara_bayar)],
                ['Anamnesa Perawat', _.get(i, 'inap.soapPerawat.anamnesa')],
                ['Anamnesa Dokter', _.get(i, 'inap.soapDokter.anamnesa')],
              ].map(j => m('tr', m('th', j[0]), m('td', j[1]))),
            ),
            m(autoForm({
              id: 'formBed',
              schema: {
                kelas: {type: String, autoform: {
                  type: 'select', options: () => _.keys(beds).map(
                    j => ({value: j, label: _.upperCase(j)})
                  )
                }},
                kamar: {type: String, autoform: {
                  type: 'select', options: () =>
                  _.flatten(_.values(beds).map(j => _.keys(j.kamar)))
                  .map(j => ({value: j, label: _.startCase(j)}))
                }},
                nomor: {type: Number},
              },
              action: (doc) => [
                updateBoth(
                  'patients', i.pasien._id, _.assign(i.pasien, {
                    rawatInap: (i.rawatInap || []).concat([{
                      tanggal_masuk: _.now(), dokter: i.inap.soapDokter.dokter,
                      observasi: [], idinap: randomId(), idrawat: i.inap.rawat,
                      cara_bayar: i.inap.cara_bayar,
                      bed: doc
                    }])
                  })
                ),
                state.admissionModal = null,
                m.redraw()
              ]
            }))
          ), m.redraw()
        ]},
        tds([
          i.pasien.identitas.no_mr,
          i.pasien.identitas.nama_lengkap,
          hari(i.inap.tanggal)
        ])
      )))
    ),
    makeModal('admissionModal'),
    m('br'),

    m('h3', 'Daftar Pasien Menginap'),
    m('table.table',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Kelas/Kamar/Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.inpatientList &&
        state.inpatientList.map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i,
            onePatientTab: 'inpatient'
          })},
          tds([
            i.identitas.no_mr,
            i.identitas.nama_lengkap,
            withThis(
              _.get(_.last(i.rawatInap), 'bed'),
              bed => [
                _.upperCase(bed.kelas),
                _.startCase(bed.kamar),
                bed.nomor
              ].join('/')
            )
          ])
        ))
      )
    )
  ),

  inpatientHistory: () => m('.content',
    m('table.table',
      m('thead', m('tr',
        ['Tanggal masuk', 'Kelas/Kamar/Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.onePatient.rawatInap || []).map(i => m('tr',
          {ondblclick: () =>
            state.modalObservasi = _.includes([2, 3], state.login.peranan) && m('.box',
              m('h3', 'Riwayat Observasi'),
              i.observasi.length ? m('p.is-italic.has-text-danger', 'klik-ganda pada salah satu observasi untuk melihat rincian') : '',
              m('table.table',
                m('thead', m('tr',
                  ['Waktu', 'Anamnesa', 'Petugas']
                  .map(j => m('th', j))
                )),
                m('tbody', i.observasi.map(j => m('tr',
                  {ondblclick: () => [
                    state.modalObservasi = null,
                    state.modalSoap = m('.box',
                      m('h4', 'Rincian SOAP'),
                      m('table.table',
                        m('tr', m('th', 'Waktu observasi'), m('td', hari(j.tanggal, true))),
                        m('tr', m('th', 'Anamnesa'), m('td', j.anamnesa)),
                        j.diagnosa && m('tr', m('th', 'Diagnosa'), m('td',
                          j.diagnosa.map(k => k.text).join(', ')
                        )),
                        j.tindakan && m('tr', m('th', 'Tindakan'), m('td',
                          j.tindakan.map(k =>
                            lookReferences(k.idtindakan).nama
                          ).join(', ')
                        )),
                        j.obat && m('tr', m('th', 'Obat'), m('td',
                          j.obat.map(k =>
                            lookGoods(k.idbarang).nama+'@'+k.jumlah
                          ).join(', ')
                        )),
                        j.planning && m('tr', m('th', 'Planning'), m('td', j.planning)),
                        m('tr', m('th', 'Tenaga medis'), m('td',
                          lookUser(j.dokter || j.perawat)
                        ))
                      ),
                      m('.button.is-info',
                        {onclick: () => makePdf.soap(
                          state.onePatient.identitas,
                          j.perawat ? {soapPerawat: j} : {soapDokter: j}
                        )},
                        m('span.icon', m('i.fas.fa-print')),
                        m('span', 'Cetak SOAP')
                      )
                    ), m.redraw()
                  ]},
                  tds([
                    hari(j.tanggal), j.anamnesa,
                    lookUser(j.perawat || j.dokter)
                  ])
                )))
              ),
              !i.keluar && m('p.buttons',
                m('.button.is-success',
                  {onclick: () => [
                    _.assign(state, {
                      route: 'formSoap', oneInap: i,
                      modalObservasi: null
                    }), m.redraw()
                  ]},
                  m('span.icon', m('i.fas.fa-user-md')),
                  m('span', 'Tambah observasi')
                ),
                m('.button.is-danger',
                  {ondblclick: () => [
                    updateBoth('patients', state.onePatient._id, _.assign(
                      state.onePatient, {rawatInap:
                        state.onePatient.rawatInap.map(j =>
                          j.idinap === i.idinap ?
                          _.assign(j, {keluar: _.now()}) : j
                        )
                      }
                    )),
                    state.modalObservasi = null,
                    m.redraw()
                  ]},
                  m('span.icon', m('i.fas.fa-door-open')),
                  m('span', 'Pulangkan pasien')
                )
              )
            )
          },
          makeModal('modalSoap'),
          tds([
            hari(i.tanggal_masuk),
            i.bed && [
              _.upperCase(i.bed.kelas),
              _.startCase(i.bed.kamar),
              i.bed.nomor
            ].join('/')
          ])
        ))
      )
    ),
    makeModal('modalObservasi')
  ),

  beds: () => m('.content',
    m('h3', 'Daftar Kamar'),
    m('table.table',
      m('tr', ['Kelas', 'Kamar', 'No. Bed', 'Penginap'].map(i => m('th', i))),
      _.flattenDepth(
        _.map(beds, (i, j) => _.map(
          i.kamar, (k, l) => _.range(k).map(m => [
            j, l, m+1, _.get(state.inpatientList.find(
              n => n.rawatInap.find(
                o => ands([
                  o.bed.kelas === j,
                  o.bed.kamar === l,
                  o.bed.nomor === m+1
                ])
              )
            ), 'identitas.nama_lengkap')
          ])
        )), 2
      ).map(p => m('tr', p.map(
        q => m('td', _.upperCase(q))
      )))
    )
  ),
})

var beds = {
  vip: {tarif: 350, kamar: {tulip: 1, bougenvil: 1, sakura: 1}},
  iii: {tarif: 200, kamar: {kenanga: 2, cempaka: 2, claudia: 2, ferbia: 2, yasmin: 2, edelwise: 2}},
  ii: {tarif: 150, kamar: {seroja: 4, mawar: 2, dahlia: 2, lili: 2, zahara: 2, matahari: 4}},
  i: {tarif: 100, kamar: {anggrek: 4, teratai: 8, kertas: 4, melati: 4}}
}
