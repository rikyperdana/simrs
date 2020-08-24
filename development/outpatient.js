/*global _ m comp look state db ands hari state ors makePdf lookUser updateBoth makeReport makeModal withThis tds dbCall moment localStorage lookReferences reports makeIconLabel*/

// TODO: di rincian kunjungan informasi soap perawat dan dokter belum lengkap seperti yg diisikan

_.assign(comp, {
  outpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    state.login.peranan === 4 && reports.outpatient(),
    m('h3', 'Antrian pasien poliklinik '+look('klinik', state.login.poliklinik)),
    m('table.table',
      m('thead', m('tr',
        ['Kunjungan Terakhir', 'No. MR', 'Nama lengkap', 'Tanggal lahir', 'Tempat lahir']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () =>
          db.patients.toArray(array =>
            state.clinicQueue = array.filter(i => withThis(
              _.last(i.rawatJalan),
              lastOne => lastOne && ands([
                // cari pasien yang belum diurus dokter klinik ini
                lastOne.klinik === state.login.poliklinik,
                !lastOne.soapDokter
              ])
            ))
          )
        },
        (state.clinicQueue || [])
        .sort((a, b) => withThis(
          obj => _.last(obj.rawatJalan).tanggal,
          lastDate => lastDate(a) - lastDate(b)
        ))
        .map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i
          })},
          tds([
            hari(_.last(i.rawatJalan).tanggal),
            i.identitas.no_mr, i.identitas.nama_lengkap,
            hari(i.identitas.tanggal_lahir),
            i.identitas.tempat_lahir
          ])
        ))
      )
    )
  ),

  outPatientHistory: () => m('.content',
    m('table.table',
      {onupdate: () => dbCall({
        method: 'find', collection: 'patients',
        _id: state.onePatient._id
      }, res => db.patients.put(res))},
      m('thead', m('tr',
        ['Tanggal berobat', 'Poliklinik', 'Cara bayar', 'Perawat', 'Dokter']
        .map(i => m('th', i)),
        state.login.peranan === 4 && m('th', 'Hapus')
      )),
      m('tbody',
        (_.get(state.onePatient, 'rawatJalan') || []).map(i => m('tr',
          {ondblclick: () => [
            state.modalVisit = _.includes([2, 3, 4], state.login.peranan) &&
            ors([i.cara_bayar !== 1, i.bayar_pendaftaran]) && m('.box',
              m('h3', 'Rincian Kunjungan'),
              m('table.table',
                m('tr', m('th', 'Tanggal'), m('td', hari(i.tanggal, true))),
                m('tr', m('th', 'Poliklinik'), m('td', look('klinik', i.klinik))),
                m('tr', m('th', 'Cara bayar'), m('td', look('cara_bayar', i.cara_bayar))),
                i.soapPerawat && [
                  m('tr', m('th', 'Anamnesa Perawat'), m('td', i.soapPerawat.anamnesa)),
                  i.soapPerawat.tekanan_darah &&
                  m('tr', m('th', 'Tekanan darah'), m('td', i.soapPerawat.tekanan_darah)),
                  ['nadi', 'suhu', 'pernapasan', 'tinggi', 'berat', 'lila']
                  .map(j => _.get(i.soapPerawat.fisik, j) && m('tr',
                    m('th', _.startCase(j)),
                    m('td', i.soapPerawat.fisik[j])
                  )),
                  i.soapPerawat.tracer && m('tr',
                    m('th', 'File Tracer'),
                    m('td', i.soapDokter.tracer)
                  )
                ],
                i.soapDokter && [
                  m('tr', m('th', 'Anamnesa Dokter'), m('td', i.soapDokter.anamnesa)),
                  _.map(i.soapDokter.diagnosa, (j, k) =>
                    m('tr', m('th', 'Diagnosa '+(k+1)), m('td', j.text+' / ICD X: '+(j.icd10 || '?')))
                  ),
                  i.soapDokter.tindakan &&
                  i.soapDokter.tindakan.map(j => j && m('tr',
                    m('th', _.get(lookReferences(j.idtindakan), 'nama')),
                    m('td', _.get(lookReferences(j.idtindakan), 'harga'))
                  )),
                  // bhp sementara ini belum ditampilkan
                  i.soapDokter.obat &&
                  i.soapDokter.obat.map(j => j && m('tr',
                    m('th', _.get(lookGoods(j.idbarang), 'nama')),
                    m('td', j.harga)
                  )),
                  i.soapDokter.planning && m('tr',
                    m('th', 'Planning'),
                    m('td', i.soapDokter.planning)
                  ),
                  i.soapDokter.keluar && m('tr',
                    m('th', 'Pilihan keluar'),
                    m('td', look('keluar', i.soapDokter.keluar))
                  ),
                  i.soapDokter.rujuk && m('tr',
                    m('th', 'Konsul ke poli lain'),
                    m('td', look('klinik', i.soapDokter.rujuk))
                  ),
                  i.soapDokter.tracer && m('tr',
                    m('th', 'File Tracer'),
                    m('td', i.soapDokter.tracer)
                  ),
                  localStorage.openBeta && [
                    (i.soapDokter.radio || []).map((j, k) => m('tr',
                      m('th', 'Cek radiologi '+(k+1)),
                      m('td', {"data-tooltip": j.diagnosa}, lookReferences(j.idradio).nama),
                      j.diagnosa && m('td', m('.button.is-info', {
                        "data-tooltip": 'Cetak lembar hasil diagnosa radiologi',
                        onclick: () => makePdf.radio(state.onePatient.identitas, j)
                      }, makeIconLabel('print', '')))
                    )),
                    (i.soapDokter.labor || []).map((j, k) => m('tr',
                      m('th', 'Cek labor '+(k+1)),
                      m('td', {"data-tooltip": j.diagnosa}, lookReferences(j.idlabor).nama),
                      m('td', j.hasil)
                    ))
                  ]
                ]
              ),
              m('p.buttons',
                ands([
                  state.login.peranan !== 1,
                  ors([
                    state.login.peranan === 2 && !i.soapPerawat,
                    state.login.peranan === 3 && !i.soapDokter,
                  ]),
                  m('.button.is-success',
                    {onclick: () =>_.assign(state, {
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
                ),
                _.get(i.soapDokter, 'labor') && m('.button.is-info',
                  {onclick: () => makePdf.labor(
                    state.onePatient.identitas, i.soapDokter.labor
                  )}, makeIconLabel('print', 'Cetak Labor')
                )
              )
            )
          ]},
          tds([
            hari(i.tanggal),
            look('klinik', i.klinik),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
          ands([
            state.login.peranan === 4,
            !i.bayar_konsultasi
          ]) && m('td', m('.button.is-danger', {
            'data-tooltip': 'klik ganda bila yakin hapus',
            ondblclick: e => [
              e.stopPropagation(),
              updateBoth('patients', state.onePatient._id, _.assign(
                state.onePatient, {rawatJalan:
                  state.onePatient.rawatJalan.filter(j =>
                    j.idrawat !== i.idrawat
                  )
                }
              ))
            ]
          }, makeIconLabel('trash-alt', 'Hapus')))
        ))
      )
    ),
    m('p.help.has-text-grey-light', 'Note: Jika pasien umum belum bayar maka tidak dapat diklik'),
    makeModal('modalVisit'),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'poliVisit'},
      makeIconLabel('file-invoice', 'Kunjungi Rawat Jalan')
    )
  )
})
