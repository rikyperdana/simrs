/*global _ m comp state autoForm schemas insertBoth makeModal db updateBoth look paginate rupiah Papa ors randomId tds dbCall withAs moment io menus betaMenus makeIconLabel ands collNames saveAs sanitize hari selects layouts*/

_.assign(comp, {
  management: () =>
    _.chunk(_.map(
      menus.management.children, (v, k) => [v, k]
    ), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('a.box', m('article.media',
          {onclick: () => [state.route = j[1], m.redraw()]},
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j[0].icon))
          ),
          m('.media-content', m('.content',m('h3', j[0].full)))
        ))
      )))
    ),

  users: () => state.login.bidang !== 5 ?
  m('p', 'Hanya untuk user manajemen') : m('.content',
    m('h3', 'Manajemen Akun'),
    m('.button.is-primary',
      {onclick: () =>
        state.modalAccount = m('.box',
          m('h3', 'Tambah Akun'),
          m(autoForm({
            id: 'createAccount', schema: schemas.account,
            layout: layouts.account,
            action: doc =>
              !(state.userList || []).find(i => i.username === doc.username) &&
              io().emit('bcrypt', doc.password, res => [
                insertBoth('users', _.assign(doc, {password: res})),
                state.modalAccount = null
              ])
          })),
          m('p.help', 'Jika tidak bisa disimpan, berarti username sudah terpakai')
        )
      },
      makeIconLabel('user-plus', 'Tambah akun')
    ), m('br'), m('br'),
    makeModal('modalAccount'),
    m('.columns',
      [
        ['peranan', 'peranan', 'user-tag', 'info'],
        ['bidang', 'bidang', 'shapes', 'success'],
        ['poliklinik', 'klinik', 'clinic-medical', 'warning']
      ].map(i => m('.column', m('.field', m('.control.has-icons-left',
        m('.select.is-fullwidth.is-'+i[3], m('select',
          {onchange: e => _.assign(state, {selection: {[i[0]]: +e.target.value}})},
          m('option', {value: ''}, 'Saring '+i[0]),
          selects(i[1])().sort((a, b) => a.label > b.label ? 1 : -1)
          .map(({value, label}) => m('option', {value}, label))
        )),
        m('.icon.is-small.is-left', m('i.fas.fa-'+i[2]))
      ))))
    ),
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () => db.users.toArray(array => [
        state.userList = array, m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama lengkap', 'Username', 'Peranan', 'Bidang', 'Poliklinik', 'Keaktifan']
        .map(i => m('th', i)))
      ),
      m('tbody', (state.userList.filter(i => ands([
        i.keaktifan === 1, !state.selection ? true :
        i[_.keys(state.selection)[0]] === _.values(state.selection)[0]
      ])) || []).map(i =>
        m('tr',
          {onclick: () =>
            state.modalAccount = m('.box',
              m('h4', 'Profil Pengguna'),
              m(autoForm({
                id: 'updateAccount', doc: i,
                schema: schemas.account,
                layout: layouts.account,
                action: doc =>
                  io().emit('bcrypt', doc.password, res => updateBoth(
                    'users', i._id, _.assign(doc, {password: res}),
                    done => done && [state.modalAccount = null, m.redraw()]
                  ))
              }))
            )
          },
          tds([
            i.nama, i.username,
            look('peranan', i.peranan),
            look('bidang', i.bidang),
            look('klinik', i.poliklinik),
            look('keaktifan', i.keaktifan)
          ])
        )
      ))
    )))
  ),

  // referensi hanya untuk kasir dan manajemen
  references: () => !_.includes([2, 5], state.login.bidang) ?
  m('p', 'Hanya untuk kasir dan manajemen') : m('.content',
    m('h3', 'Daftar Tarif'),
    ands([
      state.login.bidang === 5,
      state.login.peranan === 4
    ]) && m('.button.is-primary',
      {onclick: () => state.modalTambahTarif = m('.box',
        m('h3', 'Form Tambah Tarif Baru'),
        m('p.help.has-text-danger', 'WARNING: Pastikan tarif baru yang akan diisikan memang belum pernah ada di Database.'),
        m('p.help.has-text-danger', 'WARNING: Pelajari cara penulisan kode Grup 1, 2, 3. Ketidakcocokan isian kode berakibat fatal.'),
        m(autoForm({
          id: 'formTambahTarif',
          schema: schemas.tarif,
          layout: layouts.tarif,
          action: doc => confirm('Yakin tambah tarif baru?') && insertBoth(
            'references',
            _.assign({},
              _.pick(doc, ['nama', 'harga', 'keaktifan']),
              {0: doc.grupI, 1: doc.grupII, 2: doc.grupIII}
            ),
            res => [state.modalTambahTarif = null, m.redraw()]
          )
        }))
      )},
      makeIconLabel('plus', 'Tambah Tarif')
    ),
    makeModal('modalTambahTarif'),
    m('p.help.has-text-right', '* Tersusun alfabetis'),
    m('.box', m('.table-container', m('table.table.is-striped',
      {oncreate: () => db.references.toArray(array => [
        state.referenceList = _.sortBy(array, ['nama']),
        m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama item', 'Harga', 'Grup 1', 'Grup 2', 'Grup 3', 'Keaktifan']
        .map(i => m('th', i))
      )),
      m('tbody',
        paginate(state.referenceList || [], 'references', 20)
        .map(i => i.nama && m('tr',
          {onclick: () => ands([
            state.login.bidang === 5,
            state.login.peranan === 4
          ]) && [state.modalEditTarif = m('.box',
            m('h3', 'Form Edit Tarif'),
            m('p.help.has-text-danger', 'WARNING: Pelajari cara penulisan kode Grup 1, 2, 3. Ketidakcocokan isian kode berakibat fatal.'),
            m(autoForm({
              id: 'editTarif', doc: _.assign(i, {
                grupI: i[0], grupII: i[1], grupIII: i[2]
              }),
              schema: schemas.tarif, layout: layouts.tarif,
              action: doc => confirm('Yakin ubah tarif?') && [
                updateBoth(
                  'references', i._id, _.assign(
                    _.pick(i, ['nama', 'harga', 'keaktifan']),
                    {0: doc.grupI, 1: doc.grupII, 2: doc.grupIII},
                    _.pick(doc, ['nama', 'harga', 'keaktifan'])
                  )
                ),
                state.modalEditTarif = null,
                m.redraw()
              ]
            }))
          )]},
          tds([
            i.nama, rupiah(i.harga), i[0], i[1], i[2],
            i.keaktifan === 2 ? 'Non-aktif' : 'Aktif'
          ])
        ))
      ),
      makeModal('modalEditTarif')
    ))),
    m('div',comp.pagination(
      'references',
      _.get(state, 'referenceList.length') / 20
    ))
  ),

  database: () => !ands([
    state.login.bidang === 5,
    state.login.peranan === 4
  ]) ? m('p', 'Hanya untuk admin manajemen')
  : m('.content', m('.columns',
    m('.column', m('.box',
      m('h3', 'Backup / Restore Database'),
      m('a', {
        href: 'https://github.com/rikyperdana/simrs/wiki/Backup-and-Restore',
        target: '_blank'
      }, 'Panduan Backup dan Restore DB'),
      _.range(2).map(() => m('br')),
      m('.buttons',
        m('.button.is-info',
          {onclick: () => collNames.map(
            i => db[i].toArray(array => saveAs(
              new Blob([
                [array.map(j => sanitize(JSON.stringify(j))+';').join('\n')],
                {type: 'text/csv;charset=utf-8;'}
              ]),
              [i, hari(_.now(), true), '.csv'].join(' ')
            ))
          )},
          makeIconLabel('download', 'Backup')
        ),
        m('.button.is-danger', m('.file.is-danger', m('label.file-label',
          m('input.file-input', {
            type: 'file', name: 'import',
            onchange: e => Papa.parse(e.target.files[0], {
              delimiter: ';', newline: ';',
              complete: result => withAs(
                {
                  docs: (result.data || []).map(i => JSON.parse(i[0])),
                  collName: withAs(
                    JSON.parse(result.data[0][0]),
                    doc => ors([
                      doc.identitas && 'patients',
                      doc.username && 'users',
                      doc.batch && 'goods',
                    ])
                  )
                },
                ({docs, collName}) => dbCall(
                  {method: 'updateMany', collection: collName, documents: docs},
                  res => alert('Berhasil backup ' + docs.length + ' data ' + collName + '. Silahkan refresh.')
                )
              )
            })
          }),
          m('span.file-cta', makeIconLabel('upload', 'Restore'))
        )))
      )
    )),
    m('.column', m('.box',
      m('h3', 'Import Data'),
      m('a', {
        href: 'https://github.com/rikyperdana/simrs/wiki/Import-Master-Data',
        target: '_blank'
      }, 'Panduan Import Data Master'),
      _.range(2).map(() => m('br')),
      m('.file.is-warning',
        {onchange: e => Papa.parse(e.target.files[0], {
          header: true, complete: result => withAs(
            (collName, docs) => dbCall(
              {method: 'insertMany', collection: collName, documents: docs},
              res => res && db[collName].bulkPut(docs).then(last =>
                last && alert([
                  'Berhasil import', collName, docs.length, 'baris, silahkan refresh'
                ].join(' '))
              )
            ),
            updater => ors([
              result.data[0].harga && updater(
                'references', result.data.map(i => _.assign(i, {
                  _id: randomId(), updated: _.now(), harga: +i.harga
                }))
              ),
              result.data[0].nama_lengkap && updater(
                'patients', result.data.map(i => _.merge(
                  {updated: _.now(), _id: randomId()},
                  {identitas: _.merge(
                    {
                      keluarga: {ayah: i.ayah || '', ibu: i.ibu || '', pasangan: i.pasangan || ''},
                      kontak: i.kontak || '', nama_lengkap: _.startCase(i.nama_lengkap),
                      tanggal_input: i.tanggal_input ? +moment(i.tanggal_input) : '',
                      tanggal_lahir: i.tanggal_lahir ? +moment(i.tanggal_lahir) : '',
                      tempat_lahir: i.tempat_lahir || '', tempat_tinggal: i.tempat_tinggal || '',
                      bayar_kartu: true
                    },
                    _.fromPairs(
                      [
                        'agama', 'alias', 'darah', 'kelamin', 'ktp',
                        'nikah', 'no_mr', 'pekerjaan', 'pendidikan',
                        'provinsi', 'kota', 'kecamatan', 'kelurahan'
                      ].map(j => +i[j] ? [j, +i[j]] : ['', ''])
                    )
                  )}
                ))
              ),
              result.data[0].no_batch && updater(
                'goods', result.data.map(i => _.merge(
                  {_id: randomId(), updated: _.now()},
                  {
                    nama: i.nama_barang, jenis: +i.jenis, kandungan: i.kandungan,
                    stok_minimum: {gudang: +i.min_gudang, apotik: +i.min_apotik},
                    satuan: +i.satuan, kriteria: {
                      antibiotik: +i.antibiotik, narkotika: +i.narkotika,
                      psikotropika: +i.psikotropika, fornas: +i.fornas
                    },
                    batch: [{
                      idbatch: randomId(), no_batch: i.no_batch, merek: i.merek,
                      masuk: i.masuk && +moment(i.masuk),
                      kadaluarsa: i.kadaluarsa && +moment(i.kadaluarsa),
                      stok: {gudang: +i.digudang, apotik: +i.diapotik, karantina: +i.karantina},
                      harga: {beli: +i.beli, jual: +i.jual}, returnable: !!i.returnable,
                      sumber: {
                        supplier: i.supplier, anggaran: +i.anggaran, no_spk: i.no_spk,
                        tanggal_spk: i.tanggal_spk && +moment(i.tanggal_spk)
                      }
                    }]
                  }
                )).reduce((acc, inc) => withAs(
                  acc.find(j => j.nama === inc.nama),
                  found => found ? acc.map(j =>
                    j.nama === inc.nama ? _.assign(j, {
                      batch: [...j.batch, ...inc.batch]
                    }) : j
                  ) : [...acc, inc]
                ), [])
              )
            ])
          )
        })},
        m('label.file-label',
          m('input.file-input', {type: 'file', name: 'import'}),
          m('span.file-cta',
            makeIconLabel('file-import', 'Pilih file')
          )
        )
      )
    ))
  ))
})
