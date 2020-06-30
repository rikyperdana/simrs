/*global _ m comp look state db ands hari state ors makePdf lookUser updateBoth makeReport makeModal withThis tds dbCall moment*/

_.assign(comp, {
  outpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    // state.login.peranan === 4 &&
    makeReport('Kunjungan Poliklinik', e => withThis(
      ({
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      }),
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Kunjungan Poliklinik',
          [['Tanggal', 'Poliklinik', 'No. MR', 'Nama Pasien', 'Perawat', 'Dokter']]
          .concat(_.compact(
            array.flatMap(pasien =>
              pasien.rawatJalan &&
              pasien.rawatJalan.map(rawat =>
                _.every([
                  rawat.soapDokter,
                  rawat.tanggal > date.start &&
                  rawat.tanggal < date.end
                ]) && [
                  hari(rawat.tanggal),
                  look('klinik', rawat.klinik),
                  pasien.identitas.no_mr.toString(),
                  pasien.identitas.nama_lengkap,
                  lookUser(rawat.soapPerawat.perawat),
                  lookUser(rawat.soapDokter.dokter)
                ]
              )
            ).sort((a, b) => a.tanggal - b.tanggal)
          ))
        ))
      ]
    )),
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
                lastOne.klinik === state.login.poliklinik,
                !ands([lastOne.soapPerawat, lastOne.soapDokter])
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
      }, (res) => db.patients.put(res))},
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
                  m('tr', m('th', 'Tekanan darah'), m('td', i.soapPerawat.tekanan_darah))
                ],
                i.soapDokter && [
                  m('tr', m('th', 'Anamnesa Dokter'), m('td', i.soapDokter.anamnesa)),
                  _.map(i.soapDokter.diagnosa, (j, k) =>
                    m('tr', m('th', 'Diagnosa '+k), m('td', j.text+' / ICD X: '+(j.icd10 || '?')))
                  )
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
          ]},
          tds([
            hari(i.tanggal),
            look('klinik', i.klinik),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
          state.login.peranan === 4 && m('td', m('.button.is-danger', {
            ondblclick: (e) => [
              e.stopPropagation(),
              updateBoth('patients', state.onePatient._id, _.assign(
                state.onePatient, {rawatJalan:
                  state.onePatient.rawatJalan.filter(j =>
                    j.idrawat !== i.idrawat
                  )
                }
              ))
            ]
          }, 'Hapus'))
        ))
      )
    ),
    makeModal('modalVisit'),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'poliVisit'},
      m('span.icon', m('i.fas.fa-file-invoice')),
      m('span', 'Kunjungi Rawat Jalan')
    )
  )
})
