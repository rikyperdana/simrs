/*global _ m comp db state ands updateBoth randomId look hari makeModal lookUser lookReferences lookGoods selects makePdf makeReport withThis tds rupiah autoForm moment schemas reports makeIconLabel ors makeRincianSoapPerawat makeRincianSoapDokter*/

_.assign(comp, {
  inpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    m('h3', 'Daftar Admisi Rawat Inap'),
    state.loading && m('progress.progress.is-small.is-primary'),
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () => [
        state.loading = true,
        db.patients.toArray(array => [
          state.admissionList = _.compact(array.flatMap(i =>
            // permintaan rawat inap bisa dari rawat jalan maupun IGD
            [...(i.rawatJalan || []), ...(i.emergency || [])]
            .flatMap(j => ands([
              // cari pasien yang ditunjuk dokter untuk diinapkan
              _.get(j, 'soapDokter.keluar') === 3,
              // dan belum ada rekaman admisi ke rawat inap
              (i.rawatInap || []).filter(k =>
                k.idrawat === j.idrawat
              ).length === 0,
              {pasien: i, inap: j}
            ]))
          )),
          state.loading = false, m.redraw()
        ])
      ]},
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Tanggal admisi', 'Sumber admisi', 'Dokter']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.admissionList || [])
        .sort((a, b) => withThis(
          obj => _.get(obj.inap, 'tanggal'),
          tanggal => tanggal(a) - tanggal(b)
        )
      )
      .map(i => m('tr',
        {onclick: () => [
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
              id: 'formBed', schema: schemas.beds, layout: layouts.beds,
              action: doc => [
                // Pastikan dulu pilihan kamarnya valid, baru update
                +_.get(beds, [doc.kelas, 'kamar', doc.kamar])+1 > doc.nomor &&
                updateBoth(
                  'patients', i.pasien._id,
                  _.assign(i.pasien, {rawatInap: [
                    ...(i.pasien.rawatInap || []),
                    {
                      // buatkan record rawatInap dengan observasi kosong
                      tanggal_masuk: _.now(), dokter: i.inap.soapDokter.dokter,
                      observasi: [], idinap: randomId(), idrawat: i.inap.idrawat,
                      cara_bayar: i.inap.cara_bayar, bed: doc
                    }
                  ]}),
                  res => res && [
                    _.assign(state, {admissionList: null, admissionModal: null}),
                    m.redraw()
                  ]
                )
              ]
            })),
            m('p.help', '* Pastikan pilihan Kelas/Kamar/Bed valid.')
          ), m.redraw()
        ]},
        tds([
          i.pasien.identitas.no_mr,
          i.pasien.identitas.nama_lengkap,
          hari(i.inap.tanggal, true),
          _.get(i.inap, 'klinik') ? 'Rawat Jalan' : 'IGD',
          lookUser(_.get(i.inap, 'soapDokter.dokter'))
        ])
      )))
    ))),
    makeModal('admissionModal'),

    m('h3', 'Daftar Pasien Menginap'),
    m('p.help', '* Urut berdasarkan tanggal masuk terbaru'),
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            // cari pasien yg belum keluar dari rawat inap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Kelas / Kamar / Nomor', 'Tanggal Masuk']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.inpatientList || [])
        .sort((a, b) => withThis(
          obj => _.get(_.last(obj.rawatInap), 'tanggal_masuk'),
          lastDate => lastDate(b) - lastDate(a)
        ))
        .map(i => withThis(
          _.get(_.last(i.rawatInap), 'bed'),
          bed => bed && m('tr',
            {onclick: () => _.assign(state, {
              route: 'onePatient', onePatient: i,
              onePatientTab: 'inpatient'
            })},
            tds([
              i.identitas.no_mr,
              i.identitas.nama_lengkap,
              [
                _.upperCase(bed.kelas),
                _.startCase(bed.kamar),
                bed.nomor
              ].join(' / '),
              hari(_.get(_.last(i.rawatInap), 'tanggal_masuk'), true)
            ])
          )
        ))
      )
    )))
  ),

  inpatientHistory: () => m('.content',
    m('.box', m('.table-container', m('table.table.is-striped',
      m('thead', m('tr',
        ['Tanggal masuk', 'Kelas / Kamar / Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.onePatient.rawatInap || []).map(i => m('tr',
          {onclick: () =>
            state.modalObservasi = _.includes([2, 3, 4], state.login.peranan) && m('.box',
              m('h3', 'Riwayat Observasi'),
              Boolean(i.observasi.length) && m(
                'p.help.is-italic.has-text-info',
                'klik pada salah satu observasi untuk melihat rincian'
              ),
              m('table.table',
                m('thead', m('tr',
                  ['Waktu', 'Anamnesa', 'Petugas']
                  .map(j => m('th', j))
                )),
                m('tbody', i.observasi.map(j => m('tr',
                  {onclick: () => [
                    state.modalObservasi = null,
                    state.modalSoap = m('.box',
                      m('h4', 'Rincian SOAP'),
                      m('table.table',
                        m('tr', m('th', 'Waktu observasi'), m('td', hari(j.tanggal, true))),
                        j.diagnosa ? makeRincianSoapDokter(j) : makeRincianSoapPerawat(j)
                      ),
                      m('.button.is-info',
                        {onclick: () => makePdf.soap(
                          state.onePatient.identitas,
                          j.perawat ? {soapPerawat: j} : {soapDokter: j}
                        )},
                        makeIconLabel('print', 'Cetak SOAP')
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
                      // alihkan ke halaman formSoap di patient.js dengan membawa dokumen oneInap
                      route: 'formSoap', oneInap: i, modalObservasi: null
                    }), m.redraw()
                  ]},
                  makeIconLabel('user-md', 'Tambah observasi')
                ),
                m('.button.is-warning',
                  {onclick: () => [
                    _.assign(state, {
                      modalObservasi: null,
                      modalBedChange: m('.box',
                        m('h4', 'Pindahkan Bed Pasien'),
                        m(autoForm({
                          id: 'formBedChange', schema: schemas.beds, layout: layouts.beds,
                          confirmMessage: 'Yakin untuk memindahkan bed pasien?',
                          action: doc =>
                            +_.get(beds, [doc.kelas, 'kamar', doc.kamar])+1 > doc.nomor &&
                            updateBoth(
                              'patients', state.onePatient._id,
                              _.assign(state.onePatient, {
                                rawatInap: state.onePatient.rawatInap.map(
                                  j => j.idinap !== i.idinap ? j : _.assign(j, doc)
                                )
                              })
                            )
                        })),
                        m('p.help', '* Pastikan pilihan Kelas/Kamar/Bed valid.'),
                        m('p.help', '* Penagihan biaya di kasir akan berdasarkan kamar terakhir.')
                      )
                    }), m.redraw()
                  ]},
                  makeIconLabel('exchange-alt', 'Pindah Bed')
                ),
                m('.button.is-danger',
                  {onclick: () => [
                    confirm('Yakin untuk pulangkan pasien?') &&
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
                  makeIconLabel('door-open', 'Pulangkan pasien')
                )
              )
            )
          },
          makeModal('modalSoap'),
          tds([
            hari(i.tanggal_masuk, true),
            i.bed && [
              _.upperCase(i.bed.kelas),
              _.startCase(i.bed.kamar),
              i.bed.nomor
            ].join(' / ')
          ])
        ))
      )
    ))),
    ['modalObservasi', 'modalBedChange'].map(makeModal)
  ),

  beds: () => !ors([
    _.includes([2, 3], state.login.peranan),
    _.includes([1], state.login.bidang)
  ]) ? m('p', 'Hanya untuk tenaga medis') : m('.content',
    m('h3', 'Daftar Ketersediaan Bed'),
    m('.box', m('table.table.is-striped',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            // cari pasien yg belum keluar dari rawat inap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('tr', ['Kelas', 'Kamar', 'No. Bed', 'Nama Pasien'].map(i => m('th', i))),
      state.inpatientList && _.flattenDepth(
        _.map(beds, (i, j) => _.map(
          i.kamar, (k, l) => _.range(k).map(m => [
            j, l, m+1, _.get(state.inpatientList.find(
              n => n.rawatInap.find(
                o => o.bed && ands([
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
    ))
  ),
})
