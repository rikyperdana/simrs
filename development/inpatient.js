/*global _ m comp db state ands updateBoth randomId look hari makeModal lookUser lookReferences lookGoods selects makePdf makeReport withThis tds rupiah autoForm moment schemas reports makeIconLabel ors makeRincianSoapPerawat makeRincianSoapDokter*/

_.assign(comp, {
  inpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    state.login.peranan === 4 && reports.inpatient(),
    m('h3', 'Daftar Admisi Rawat Inap'),
    m('table.table',
      {onupdate: () =>
        db.patients.toArray(array =>
          state.admissionList = _.compact(array.flatMap(i =>
            // permintaan rawat inap bisa dari rawat jalan maupun IGD
            ([]).concat(i.rawatJalan || [], i.emergency || [])
            .flatMap(j => ands([
              // cari pasien yang ditunjuk dokter untuk diinapkan
              _.get(j, 'soapDokter.keluar') === 3,
              // dan belum ada rekaman admisi ke rawat inap
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
              id: 'formBed', schema: schemas.beds,
              action: doc => [
                updateBoth(
                  'patients', i.pasien._id, _.assign(i.pasien, {
                    rawatInap: (i.pasien.rawatInap || []).concat([{
                      // buatkan record rawatInap dengan observasi kosong
                      tanggal_masuk: _.now(), dokter: i.inap.soapDokter.dokter,
                      observasi: [], idinap: randomId(), idrawat: i.inap.idrawat,
                      cara_bayar: i.inap.cara_bayar, bed: doc
                    }])
                  })
                ),
                _.assign(state, {admissionList: null, admissionModal: null}),
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
            // cari pasien yg belum keluar dari rawat inap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Kelas / Kamar / Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.inpatientList &&
        state.inpatientList.map(i => withThis(
          _.get(_.last(i.rawatInap), 'bed'),
          bed => bed && m('tr',
            {ondblclick: () => _.assign(state, {
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
              ].join(' / ')
            ])
          )
        ))
      )
    )
  ),

  inpatientHistory: () => m('.content',
    m('table.table',
      m('thead', m('tr',
        ['Tanggal masuk', 'Kelas / Kamar / Nomor']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.onePatient.rawatInap || []).map(i => m('tr',
          {ondblclick: () =>
             // untuk melihat 1 rekaman observasi
            state.modalObservasi = _.includes([2, 3, 4], state.login.peranan) && m('.box',
              m('h3', 'Riwayat Observasi'),
              Boolean(i.observasi.length) && m(
                'p.help.is-italic.has-text-info',
                'klik-ganda pada salah satu observasi untuk melihat rincian'
              ),
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
                  makeIconLabel('door-open', 'Pulangkan pasien')
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
            ].join(' / ')
          ])
        ))
      )
    ),
    makeModal('modalObservasi')
  ),

  beds: () => !ors([
    _.includes([2, 3], state.login.peranan),
    _.includes([1], state.login.bidang)
  ]) ? m('p', 'Hanya untuk tenaga medis') : m('.content',
    m('h3', 'Daftar Kamar'),
    m('table.table',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            // cari pasien yg belum keluar dari rawat inap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('tr', ['Kelas', 'Kamar', 'No. Bed', 'Penginap'].map(i => m('th', i))),
      state.inpatientList && _.flattenDepth(
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
  kl1: {tarif: 200, kamar: {kenanga: 2, cempaka: 2, claudia: 2, ferbia: 2, yasmin: 2, edelwise: 2}},
  kl2: {tarif: 150, kamar: {seroja: 3, mawar: 2, dahlia: 2, lili: 2, zahara: 2, matahari: 4}},
  kl3: {tarif: 100, kamar: {anggrek: 4, teratai: 7, kertas: 3, melati: 5}}
}
