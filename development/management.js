/*global _ m comp state autoForm schemas insertBoth makeModal db updateBoth look paginate rupiah Papa ors randomId tds dbCall withThis moment io menus betaMenus makeIconLabel*/

_.assign(comp, {
  users: () => state.login.bidang !== 5 ?
  m('p', 'Hanya untuk user manajemen') : m('.content',
    m('h3', 'Manajemen Akun'),
    m('.button.is-primary',
      {onclick: () =>
        state.modalAccount = m('.box',
          m('h3', 'Tambah Akun'),
          m(autoForm({
            id: 'createAccount', schema: schemas.account,
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
    m('.box', m('table.table.is-striped',
      {onupdate: () => db.users.toArray(array => [
        state.userList = array, m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama lengkap', 'Username', 'Peranan', 'Bidang', 'Poliklinik', 'Keaktifan']
        .map(i => m('th', i)))
      ),
      m('tbody', (state.userList.filter(i =>
        i.keaktifan === 1
      ) || []).map(i =>
        m('tr',
          {ondblclick: () =>
            state.modalAccount = m('.box',
              m('h4', 'Profil Pengguna'),
              m(autoForm({
                id: 'updateAccount', schema: schemas.account, doc: i,
                action: doc =>
                  io().emit('bcrypt', doc.password, res => [
                    updateBoth('users', i._id, _.assign(doc, {password: res})),
                    state.modalAccount = null, m.redraw()
                  ])
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
    ))
  ),

  // referensi harus terbuka untuk seluruh pihak
  references: () => m('.content',
    m('h3', 'Daftar Tarif'),
    m('p.help', '* Tersusun alfabetis'),
    m('.box', m('table.table.is-striped',
      {oncreate: () => db.references.toArray(array => [
        state.referenceList = _.sortBy(array, ['nama']),
        m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama item', 'Harga', 'Grup 1', 'Grup 2', 'Grup 3']
        .map(i => m('th', i))
      )),
      m('tbody',
        paginate(state.referenceList || [], 'references', 20)
        .map(i => i.nama && m('tr', tds([
          i.nama, rupiah(i.harga), i[0], i[1], i[2]
        ])))
      )
    )),
    m('div',comp.pagination(
      'references',
      _.get(state, 'referenceList.length') / 20
    )),
    ands([
      state.login.bidang === 5,
      state.login.peranan === 4
    ]) && [
      m('h3', 'Import Data'),
      m('.file.is-danger',
        {onchange: e => Papa.parse(e.target.files[0], {
          header: true, complete: result => withThis(
            (collName, docs) => [
              dbCall({
                method: 'insertMany', collection: collName, documents: docs
              }, () => ''),
              db[collName].bulkPut(docs).then(last =>
                last && alert('Berhasil import, silahkan refresh')
              )
            ],
            updater => ors([
              result.data[0].harga && updater(
                'references', result.data.map(i =>
                  _.merge(i, {_id: randomId(), updated: _.now()})
                )
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
                      ['agama', 'alias', 'darah', 'kelamin', 'ktp',
                       'nikah', 'no_mr', 'pekerjaan', 'pendidikan']
                      .map(j => +i[j] ? [j, +i[j]] : ['', ''])
                    )
                  )}
                ))
              ),
              result.data[0].no_batch && updater(
                'goods', result.data.map(i => _.merge(
                  {_id: randomId(), updated: _.now()},
                  {
                    nama: i.nama_barang, jenis: +i.jenis, kandungan: i.kandungan,
                    satuan: +i.satuan, kriteria: {
                      antibiotik: +i.antibiotik, narkotika: +i.narkotika,
                      psikotropika: +i.psikotropika, fornas: +i.fornas
                    },
                    batches: [{
                      idbatch: randomId(), no_batch: i.no_batch, merek: i.merek,
                      masuk: i.masuk && +moment(i.masuk),
                      kadaluarsa: i.kadaluarsa && +moment(i.kadaluarsa),
                      stok: {gudang: +i.digudang, apotik: +i.diapotik, retur: +i.diretur},
                      harga: {beli: +i.beli, jual: +i.jual}, returnable: !!i.returnable,
                      sumber: {
                        supplier: i.supplier, anggaran: +i.anggaran, no_spk: i.no_spk,
                        tanggal_spk: i.tanggal_spk && +moment(i.tanggal_spk)
                      }
                    }]
                  }
                )).reduce((acc, inc) => withThis(
                  acc.find(j => j.nama === inc.nama),
                  found => found ? acc.map(j =>
                    j.nama === inc.nama ? _.assign(j, {
                      batches: [...j.batches, ...inc.batches]
                    }) : j
                  ) : [...acc, inc]
                ), [])
              )
            ])
          )
        })},
        m('label.file-label',
          m('input.file-input', {type: 'file', name: 'import'}),
          m('span.file-cta', m('span.file-label', 'Pilih file'))
        )
      ),
      m('a.help', {
        href: 'https://github.com/rikyperdana/simrs/wiki/Import-Master-Data',
        target: '_blank'
      }, 'Panduan Import Data Master')
    ]
  ),

  management: () =>
    _.chunk(_.map(
      menus.management.children, (v, k) => [v, k]
    ), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('.box', m('article.media',
          {onclick: () => [state.route = j[1], m.redraw()]},
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j[0].icon))
          ),
          m('.media-content', m('.content',m('h3', j[0].full)))
        ))
      )))
    ),
})
