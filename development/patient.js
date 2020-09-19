/*global _ m comp state db hari look moment makePdf ors ands state autoForm schemas updateBoth state randomId withThis makeModal makeIconLabel*/

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
      m('.box', m('.table-container', m('table.table.is-striped', _.chunk([
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
      )))))),
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
          makeIconLabel(i.icon, i.label)
        ))
      ),
      makeModal('modalRekapSoap'),
      m('.tabs.is-boxed', m('ul',
        {style: 'margin-left: 0%'},
        _.map({
          outpatient: ['Riwayat Rawat Jalan', 'walking'],
          emergency: ['Riwayat IGD', 'ambulance'],
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
            makeIconLabel(val[1], val[0])
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
    {
      onupdate: () => [
        db.goods.toArray(array => _.assign(state, {
          goodsList: array,
          drugList: array.filter(i => ands([
            i.jenis === 1,
            i.batch.filter(j => ands([
              j.stok.apotik,
              j.kadaluarsa > _.now()
            ])).length
          ])),
          bhpList: array.filter(i => i.jenis === 2),
        })),
        db.references.filter(i => _.every([
          i[0] === 'rawatJalan',
          i[1] === _.snakeCase(look(
            'klinik', state.login.poliklinik
          ))
        ]))
        .toArray(array => state.daftarTindakan = array),
        db.references.filter(i => i[0] === 'radiologi')
        .toArray(array => state.daftarRadio = array),
        state.spm = _.now()
      ]
    },
    m('h3', 'Form SOAP'),
    m(autoForm({
      id: 'soapMedis', autoReset: true,
      confirmMessage: 'Yakin untuk menyimpan SOAP?',
      schema: ors([
        state.login.peranan === 2 && schemas.soapPerawat,
        state.login.peranan === 3 && ors([
          state.oneInap && _.merge(
            _.omit(schemas.soapDokter, ['rujuk', 'keluar']),
            schemas.gizi
          ),
          schemas.soapDokter
        ])
      ]),
      action: doc => withThis(
        ands([
          !_.get(state, 'oneInap'),
          _.get(state, 'oneRawat.klinik') ? 'rawatJalan' : 'emergency',
        ]),
        facility => [
          // jika berasal dari rawat jalan atau IGD
          facility && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {[facility]: state.onePatient[facility].map(i =>
              i.idrawat === state.oneRawat.idrawat ?
              _.merge(state.oneRawat, ors([
                state.login.peranan === 2 && {soapPerawat: doc},
                state.login.peranan === 3 && {soapDokter: doc}
              ])) : i
            )}
          )),
          // jika berasal dari observasi rawat inap
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
          // jika ada rujuk konsul maka regiskan pasien dengan ikut cara bayar awal
          ands([doc.keluar === 2, doc.rujuk]) &&
          updateBoth('patients', state.onePatient._id, _.assign(state.onePatient, {
            rawatJalan: [...(state.onePatient.rawatJalan || []), _.assign(
              _.pick(state.oneRawat, ['cara_bayar', 'sumber_rujukan', 'penanggungjawab', 'no_sep']),
              {idrawat: randomId(), tanggal: _.now(), klinik: doc.rujuk}
            )]
          })),
          _.assign(state, {route: 'onePatient', oneRawat: null, oneInap: null}),
          m.redraw()
        ]
      )
    }))
  ),
})
