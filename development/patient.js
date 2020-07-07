/*global _ m comp state db hari look moment makePdf ors ands state autoForm schemas updateBoth state randomId withThis makeModal*/

_.assign(comp, {
  onePatient: () => withThis(
    state.onePatient.identitas,
    id => m('.content',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.goods.toArray(array => state.goodsList = array),
        db.users.toArray(array => state.userList = array)
      ]},
      m('h3', 'Rekam Medik Pasien'),
      m('table.table', _.chunk([
        ['No. MR', id.no_mr],
        ['Nama Lengkap', id.nama_lengkap],
        ['Tanggal lahir', hari(id.tanggal_lahir)],
        ['Tempat lahir', id.tempat_lahir],
        ['Jenis kelamin', look('kelamin', id.kelamin)],
        ['Agama', look('agama', id.agama)],
        ['Status nikah', look('nikah', id.nikah)],
        ['Pendidikan terakhir', look('pendidikan', id.pendidikan)],
        ['Golongan Darah', look('darah', id.darah)],
        ['Pekerjaan', look('pekerjaan', id.pekerjaan)],
        ['Tempat tinggal', id.tempat_tinggal],
        ['Umur', moment().diff(id.tanggal_lahir, 'years')+' tahun'],
        ['Nama Bapak', id.keluarga.ayah],
        ['Nama Ibu', id.keluarga.ibu],
        ['Nama Suami/Istri', id.keluarga.pasangan],
        ['No. Handphone', id.kontak]
      ], 4).map(i => m('tr', i.map(j =>
        [m('th', j[0]), m('td', j[1])]
      )))),
      m('p.buttons',
        [
          {
            label: 'Cetak kartu', icon: 'id-card', color: 'info',
            click: () => makePdf.card(id)
          },
          {
            label: 'General consent', icon: 'file-contract', color: 'info',
            click: () => makePdf.consent(id)
          },
          {
            label: 'Update pasien', icon: 'edit', color: 'warning',
            click: () => state.route = 'updatePatient'
          },
          {
            label: 'Riwayat SOAP', icon: 'bars', color: 'info',
            click: () => state.modalRekapSoap = m('.box',
              m('h3', 'Rekap SOAP Pasien'),
              m('p.help', 'Berurut kronologis'),
              [
                ...(state.onePatient.rawatJalan || []),
                ...(state.onePatient.emergency || []),
              ].map(i => m('table.table',
                i.soapPerawat && i.soapDokter && [
                  ['Tanggal Kunjungan', hari(i.tanggal, true)],
                  ['Layanan', i.klinik ? look('klinik', i.klinik) : 'Emergency'],
                  ['Anamnesa Perawat', i.soapPerawat.anamnesa],
                  ['Diagnosa Dokter', i.soapDokter.diagnosa.map(i => i.text).join(', ')]
                ].map(j => m('tr', m('th', j[0]), m('td', j[1])))
              ))
            )
          }
        ]
        .map(i => m('.button.is-'+i.color,
          {onclick: i.click},
          m('span.icon', m('i.fas.fa-'+i.icon)),
          m('span', i.label)
        ))
      ),
      makeModal('modalRekapSoap'),
      m('.tabs.is-boxed', m('ul',
        {style: 'margin-left: 0%'},
        _.map({
          outpatient: ['Riwayat Rawat Jalan', 'walking'],
          emergency: ['Riwayat UGD', 'ambulance'],
          inpatient: ['Riwayat Rawat Inap', 'bed']
        }, (val, key) => m('li',
          {class: ors([
            key === state.onePatientTab,
            ands([
              !state.onePatientTab,
              _.get(state, 'login.poliklinik'),
              key === 'outpatient'
            ])
          ]) && 'is-active'},
          m('a',
            {onclick: () => [state.onePatientTab = key, m.redraw()]},
            m('span.icon', m('i.fas.fa-'+val[1])),
            m('span', val[0])
          )
        ))
      )),
      m('div', ({
        outpatient: comp.outPatientHistory(),
        emergency: comp.emergencyHistory(),
        inpatient: comp.inpatientHistory()
      })[state.onePatientTab || ors([
        _.get(state, 'login.poliklinik') && 'outpatient'
      ])])
    )
  ),

  formSoap: () => m('.content',
    {onupdate: () =>
      db.goods.toArray(array => [
        state.goodsList = array,
        state.drugList = array.filter(i =>
          i.batch.reduce((j, k) =>
            j + (k.stok.apotik || 0)
          , 0) > (_.get(i, 'stok_minimum.apotik') || 0)
        )
     ])
    },
    m('h3', 'Form SOAP'),
    m('div', {oncreate: () => [
      db.references.filter(i =>
        _.every([
          i[0] === 'rawatJalan',
          i[1] === _.snakeCase(look(
            'klinik', state.login.poliklinik
          ))
        ])
      ).toArray(array =>
        state.references = array
      ), state.spm = _.now()
    ]}),
    m(autoForm({
      id: 'soapMedis', autoReset: true,
      confirmMessage: 'Yakin untuk menyimpan SOAP?',
      schema: ors([
        state.login.peranan === 2 && schemas.soapPerawat,
        state.login.peranan === 3 && ors([
          state.oneInap && _.omit(schemas.soapDokter, 'keluar'),
          schemas.soapDokter
        ])
      ]),
      action: doc => withThis(
        state.oneRawat &&
        (state.oneRawat.klinik ? 'rawatJalan' : 'emergency'),
        facility => [
          facility && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {[facility]: state.onePatient[facility].map(i =>
              i.idrawat === state.oneRawat.idrawat ?
              _.merge(state.oneRawat, ors([
                state.login.peranan === 2 && {soapPerawat: doc},
                state.login.peranan === 3 && {soapDokter: doc}
              ])) : i
            )}
          )),
          state.oneInap && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {rawatInap:
              state.onePatient.rawatInap.map(i =>
                i.idinap === state.oneInap.idinap ?
                _.assign(state.oneInap, {observasi:
                  state.oneInap.observasi.concat([_.merge(
                    doc, {tanggal: _.now(), idobservasi: randomId()}
                  )])
                }) : i
              )
            }
          )),
          _.assign(state, {
            route: 'onePatient', oneRawat: null, oneInap: null
          }),
          m.redraw()
        ]
      )
    }))
  ),
})
