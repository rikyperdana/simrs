/*global _ m comp db state ors hari look lookUser lookReferences updateBoth makeModal withThis*/

_.assign(comp, {
  icd: () => state.login.bidang !== 1 ?
  m('p', 'Hanya untuk bidang Pendaftaran/ICD') : m('.content',
    m('h3', 'Kodifikasi Diagnosa ICD 10 & ICD 9-CM'),
    m('table.table',
      m('thead', m('tr',
        ['Nama pasien', 'Tanggal kunjungan', 'Layanan', 'Perawat', 'Dokter', 'ICD10', 'ICD9CM']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () => [
          db.patients.toArray(array =>
            state.codifications = _.compact(array.flatMap(a =>
              ([]).concat(
                a.rawatJalan || [], a.emergency || [],
                a.rawatInap ? a.rawatInap.flatMap(b =>
                  b.observasi ? b.observasi.map(c =>
                    c.dokter && {idinap: b.idinap, soapDokter: c}
                  ) : []
                ) : []
              ).flatMap(b =>
                ([]).concat(
                  _.get(b, 'soapDokter.diagnosa') || [],
                  _.get(b, 'soapDokter.tindakan') || []
                ).filter(c => !c.code).length &&
                _.merge({}, a, b)
              )
            ))
          ),
          db.references.toArray(array =>
            state.references = array
          )
        ]},
        (state.codifications || []).map(a => m('tr',
          m('td', a.identitas.nama_lengkap), m('td', hari(a.tanggal)),
          m('td', ors([
            a.klinik && look('klinik', a.klinik),
            a.idrawat && 'IGD', 'Rawat Inap'
          ])),
          m('td',
            lookUser(_.get(a, 'soapPerawat.perawat'))),
            m('td', lookUser(a.soapDokter.dokter)
          ),
          m('td', m('.button',
            {onclick: () =>
              state.modalICD10 = m('.box',
                m('h4', 'Form kodifikasi diagnosa ICD10'),
                m('form',
                  {onsubmit: e => withThis(
                    a.idrawat && a.klinik ? 'rawatJalan' : 'emergency',
                    facility => [
                      e.preventDefault(),
                      a.idrawat ? updateBoth('patients', a._id,
                        _.assign({
                          _id: a._id, identitas: a.identitas,
                          rawatJalan: a.rawatJalan || [],
                          emergency: a.emergency || [],
                          rawatInap: a.rawatInap || []
                        }, {[facility]: a[facility].map(b =>
                          b.idrawat === a.idrawat ? _.assign(b, {soapDokter: _.assign(
                            b.soapDokter, {diagnosa: b.soapDokter.diagnosa.map((c, d) =>
                              ({text: c.text, code: _.compact(_.map(e.target, f =>
                                f.name && f.value
                              ))[d]})
                            )}
                          )}) : b
                        )})
                      ) : updateBoth('patients', a._id, {
                        _id: a._id, identitas: a.identitas,
                        rawatJalan: a.rawatJalan || [],
                        emergency: a.emergency || [],
                        rawatInap : a.rawatInap.map(b =>
                          b.idinap === a.idinap ?
                          _.assign(b, {observasi: b.observasi.map(c =>
                            c.idobservasi === a.soapDokter.idobservasi ?
                            _.assign(c, {diagnosa: c.diagnosa.map((d, f) =>
                              ({text: d.text, code: _.compact(_.map(e.target, g =>
                                g.name && g.value
                              ))[f]})
                            )}) : c
                          )}) : b
                        )
                      }),
                      state.modalICD10 = null,
                      m.redraw()
                    ]
                  )},
                  m('table.table',
                    m('thead', m('tr', m('th', 'Teks'), m('th', 'Kode'))),
                    m('tbody', a.soapDokter.diagnosa.map((b, c) => m('tr',
                      m('td', b.text), m('td', m('input.input', {
                        type: 'text', name: c, value: b.code
                      }))
                    )))
                  ),
                  m('input.button.is-primary', {type: 'submit', value: 'Submit'})
                )
              )
            },
            _.every(
              a.soapDokter.diagnosa.map(b => b.code)
            ) ? 'Selesai' : 'Belum'
          )),
          m('td', a.soapDokter.tindakan && m('.button',
            {onclick: () =>
              state.modalICD9 = m('.box',
                m('h4', 'Form kodifikasi tindakan ICD9'),
                m('form',
                  {onsubmit: e => withThis(
                    a.idrawat && a.klinik ? 'rawatJalan' : 'emergency',
                    facility => [
                      e.preventDefault(),
                      a.idrawat ? updateBoth('patients', a._id,
                        _.assign({
                          _id: a._id, identitas: a.identitas,
                          rawatJalan: a.rawatJalan || [],
                          emergency: a.emergency || [],
                          rawatInap: a.rawatInap || []
                        }, {[facility]: a[facility].map(b =>
                          b.idrawat === a.idrawat ? _.assign(b, {soapDokter: _.assign(
                            b.soapDokter, {tindakan: b.soapDokter.tindakan.map((c, d) =>
                              ({text: c.idtindakan, code: _.compact(_.map(e.target, f =>
                                f.name && f.value
                              ))[d]})
                            )}
                          )}) : b
                        )})
                      ) : updateBoth('patients', a._id, {
                        _id: a._id, identitas: a.identitas,
                        rawatJalan: a.rawatJalan || [],
                        emergency: a.emergency || [],
                        rawatInap : a.rawatInap.map(b =>
                          b.idinap === a.idinap ?
                          _.assign(b, {observasi: b.observasi.map(c =>
                            c.idobservasi === a.soapDokter.idobservasi ?
                            _.assign(c, {tindakan: c.tindakan.map((d, f) =>
                              ({text: d.text, code: _.compact(_.map(e.target, g =>
                                g.name && g.value
                              ))[f]})
                            )}) : c
                          )}) : b
                        )
                      }),
                      state.modalICD9 = null,
                      m.redraw()
                    ]
                  )},
                  m('table.table',
                    m('thead', m('tr', m('th', 'Teks'), m('th', 'Kode'))),
                    m('tbody', a.soapDokter.tindakan.map((b, c) => m('tr',
                      m('td', lookReferences(b.idtindakan).nama),
                      m('td', m('input.input', {
                        type: 'text', name: c, value: b.code
                      }))
                    )))
                  ),
                  m('input.button.is-primary', {type: 'submit', value: 'Submit'})
                )
              )
            },
            _.every(a.soapDokter.tindakan.map(b => b.code)) ? 'Selesai' : 'Belum'
          ))
        ))
      )
    ),
    makeModal('modalICD10'),
    makeModal('modalICD9')
  )
})