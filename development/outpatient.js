/*global _ m comp look state db ands hari state ors makePdf lookUser updateBoth makeReport makeModal withThis tds dbCall moment localStorage lookReferences reports makeIconLabel makeRincianSoapPerawat makeRincianSoapDokter*/

_.assign(comp, {
  outpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Hanya untuk tenaga medis') : m('.content',
    m('h3', 'Antrian pasien poliklinik '+look('klinik', state.login.poliklinik)),
    m('.box', m('.table-container', m('table.table.is-striped',
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
          obj => _.get(_.last(obj.rawatJalan), 'tanggal'),
          lastDate => lastDate(a) - lastDate(b)
        ))
        .map(i => m('tr',
          {onclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i
          })},
          tds([
            hari(_.get(_.last(i.rawatJalan), 'tanggal'), true),
            i.identitas.no_mr, i.identitas.nama_lengkap,
            hari(i.identitas.tanggal_lahir),
            i.identitas.tempat_lahir
          ])
        ))
      )
    )))
  ),

  outPatientHistory: () => m('.content',
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () => dbCall({
        method: 'findOne', collection: 'patients',
        _id: state.onePatient._id
      }, res => res && db.patients.put(res))},
      m('thead', m('tr',
        ['Tanggal berobat', 'Poliklinik', 'Cara bayar', 'Perawat', 'Dokter']
        .map(i => m('th', i)),
        state.login.peranan === 4 && m('th', 'Hapus')
      )),
      m('tbody',
        (_.get(state.onePatient, 'rawatJalan') || []).map(i => m('tr',
          {onclick: () => [
            state.modalVisit = _.includes([2, 3, 4], state.login.peranan) &&
            ors([i.cara_bayar !== 1, i.bayar_pendaftaran]) && m('.box',
              m('h3', 'Rincian Kunjungan Rawat Jalan'),
              m('table.table',
                m('tr', m('th', 'Tanggal'), m('td', hari(i.tanggal, true))),
                m('tr', m('th', 'Poliklinik'), m('td', look('klinik', i.klinik))),
                m('tr', m('th', 'Cara bayar'), m('td', look('cara_bayar', i.cara_bayar))),
                makeRincianSoapPerawat(i.soapPerawat),
                makeRincianSoapDokter(i.soapDokter),
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
            onclick: e => [
              e.stopPropagation(),
              confirm('Yakin hapus riwayat rawat jalan ini?') &&
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
    ))),
    m('p.help.has-text-grey-light', 'Note: Jika pasien umum belum bayar maka tidak dapat diklik'),
    makeModal('modalVisit'),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'poliVisit'},
      makeIconLabel('file-invoice', 'Kunjungi Rawat Jalan')
    )
  )
})
