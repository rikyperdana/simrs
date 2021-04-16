/*global _ m comp db state ors hari look lookUser lookReferences updateBoth makeModal withThis tds*/

_.assign(comp, {
  icd: () => state.login.bidang !== 1 ?
  m('p', 'Hanya untuk bidang Pendaftaran/ICD') : m('.content',
    m('h3', 'Kodifikasi Diagnosa ICD 10 & ICD 9-CM'),
    m('.box', m('.table-container', m('table.table.is-striped',
      m('thead', m('tr',
        ['Nama pasien', 'Tanggal kunjungan', 'Layanan', 'Perawat', 'Dokter', 'ICD10', 'ICD9CM']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          db.patients.toArray(array =>
            state.codifications = _.compact(array.flatMap(a =>
              [
                ...(a.rawatJalan || []), ...(a.emergency || []),
                ...(a.rawatInap ? a.rawatInap.flatMap(b =>
                  b.observasi ? b.observasi.map(c => c.dokter && {
                    idinap: b.idinap, soapDokter: c, tanggal: b.tanggal_masuk
                  }) : []
                ) : [])
              ].flatMap(b =>
                [
                  ...(_.get(b, 'soapDokter.diagnosa') || []),
                  ...(_.get(b, 'soapDokter.tindakan') || [])
                ].filter(c => !c.code).length &&
                {pasien: a, rawat: b}
              )
            ))
          ),
          db.references.toArray(array =>
            state.references = array
          )
        ]},
        (state.codifications || [])
        .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
        .map(({pasien, rawat}) => m('tr', tds([
          pasien.identitas.nama_lengkap, hari(rawat.tanggal, true),
          ors([
            rawat.klinik && look('klinik', rawat.klinik),
            rawat.idrawat && 'IGD', 'Rawat Inap'
          ]),
          lookUser(_.get(rawat, 'soapPerawat.perawat')),
          lookUser(rawat.soapDokter.dokter),
          m('.button',
            {onclick: () =>
              state.modalICD10 = m('.box',
                m('h4', 'Form kodifikasi diagnosa ICD10'),
                m('form',
                  {onsubmit: e => confirm('Yakin dengan isian ICD ini?') && withThis(
                    rawat.idrawat && rawat.klinik ? 'rawatJalan' : 'emergency',
                    facility => [
                      e.preventDefault(),
                      !rawat.idinap ? updateBoth(
                        'patients', pasien._id,
                        _.assign({
                          _id: pasien._id, identitas: pasien.identitas,
                          rawatJalan: pasien.rawatJalan || [],
                          emergency: pasien.emergency || [],
                          rawatInap: pasien.rawatInap || []
                        }, {[facility]: pasien[facility].map(b =>
                          b.idrawat === rawat.idrawat ? _.assign(b, {soapDokter: _.assign(
                            b.soapDokter, {diagnosa: b.soapDokter.diagnosa.map((c, d) =>
                              ({text: c.text, code: _.compact(_.map(e.target, f =>
                                f.name && f.value
                              ))[d]})
                            )}
                          )}) : b
                        )}),
                        res => res && [
                          state.codifications = [],
                          m.redraw()
                        ]
                      ) : updateBoth(
                        'patients', pasien._id, {
                          _id: pasien._id, identitas: pasien.identitas,
                          rawatJalan: pasien.rawatJalan || [],
                          emergency: pasien.emergency || [],
                          rawatInap : pasien.rawatInap.map(b =>
                            b.idinap === rawat.idinap ?
                            _.assign(b, {observasi: b.observasi.map(c =>
                              c.idobservasi === rawat.soapDokter.idobservasi ?
                              _.assign(c, {diagnosa: c.diagnosa.map((d, f) =>
                                ({text: d.text, code: _.compact(_.map(e.target, g =>
                                  g.name && g.value
                                ))[f]})
                              )}) : c
                            )}) : b
                          )
                        },
                        res => res && [
                          state.codifications = [],
                          m.redraw()
                        ]
                      ),
                      state.modalICD10 = null,
                      m.redraw()
                    ]
                  )},
                  m('table.table',
                    m('thead', m('tr', m('th', 'Teks'), m('th', 'Kode'))),
                    m('tbody', rawat.soapDokter.diagnosa.map((b, c) => m('tr', tds([
                      b.text, m('input.input', {type: 'text', name: c, value: b.code})
                    ]))))
                  ),
                  m('input.button.is-primary', {type: 'submit', value: 'Submit'})
                )
              )
            },
            _.every((
              _.get(rawat, 'soapDokter.diagnosa') || []
            ).map(b => b.code)) ? 'Selesai' : 'Belum'
          ),
          rawat.soapDokter.tindakan && m('.button',
            {onclick: () =>
              state.modalICD9 = m('.box',
                m('h4', 'Form kodifikasi tindakan ICD9'),
                m('form',
                  {onsubmit: e => confirm('Yakin dengan ICD ini?') && withThis(
                    rawat.idrawat && rawat.klinik ? 'rawatJalan' : 'emergency',
                    facility => [
                      e.preventDefault(),
                      rawat.idrawat ? updateBoth(
                        'patients', pasien._id,
                        _.assign({
                          _id: pasien._id, identitas: pasien.identitas,
                          rawatJalan: pasien.rawatJalan || [],
                          emergency: pasien.emergency || [],
                          rawatInap: pasien.rawatInap || []
                        }, {[facility]: pasien[facility].map(b =>
                          b.idrawat === rawat.idrawat ? _.assign(b, {soapDokter: _.assign(
                            b.soapDokter, {tindakan: b.soapDokter.tindakan.map((c, d) =>
                              ({text: c.idtindakan, code: _.compact(_.map(e.target, f =>
                                f.name && f.value
                              ))[d]})
                            )}
                          )}) : b
                        )}),
                        res => res && [
                          state.codifications = [],
                          m.redraw()
                        ]
                      ) : updateBoth(
                        'patients', pasien._id, {
                          _id: pasien._id, identitas: pasien.identitas,
                          rawatJalan: pasien.rawatJalan || [],
                          emergency: pasien.emergency || [],
                          rawatInap : pasien.rawatInap.map(b =>
                            b.idinap === rawat.idinap ?
                            _.assign(b, {observasi: b.observasi.map(c =>
                              c.idobservasi === rawat.soapDokter.idobservasi ?
                              _.assign(c, {tindakan: c.tindakan.map((d, f) =>
                                ({text: d.text, code: _.compact(_.map(e.target, g =>
                                  g.name && g.value
                                ))[f]})
                              )}) : c
                            )}) : b
                          )
                        },
                        res => res && [
                          state.codifications = [],
                          m.redraw()
                        ]
                      ),
                      state.modalICD9 = null,
                      m.redraw()
                    ]
                  )},
                  m('table.table',
                    m('thead', m('tr', m('th', 'Teks'), m('th', 'Kode'))),
                    m('tbody', (_.get(rawat, 'soapDokter.tindakan') || [])
                    .map((b, c) => m('tr', tds([
                      lookReferences(b.idtindakan).nama,
                      m('input.input', {type: 'text', name: c, value: b.code})
                    ]))))
                  ),
                  m('input.button.is-primary', {type: 'submit', value: 'Submit'})
                )
              )
            },
            _.every((
              _.get(rawat, 'soapDokter.tindakan') || []
            ).map(b => b.code)) ? 'Selesai' : 'Belum'
          )
        ])))
      )
    ))),
    ['modalICD10', 'modalICD9'].map(makeModal)
  )
})
