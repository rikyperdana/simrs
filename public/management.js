/*global _ m comp state autoForm schemas insertBoth makeModal db updateBoth look paginate rupiah Papa ors randomId tds dbCall withThis*/

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
            action: doc => [
              insertBoth('users', doc),
              state.modalAccount = null
            ]
          }))
        )
      },
      m('span.icon', m('i.fas.fa-user-plus')),
      m('span', 'Tambah akun')
    ),
    makeModal('modalAccount'),
    m('table.table',
      {onupdate: () => db.users.toArray(array => [
        state.userList = array, m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama lengkap', 'Gmail', 'Peranan', 'Bidang', 'Poliklinik', 'Keaktifan']
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
                id: 'updateAccount', schema: schemas.account,
                doc: i, action: doc => [
                  updateBoth('users', i._id, doc),
                  state.modalAccount = null, m.redraw()
                ]
              }))
            )
          },
          tds([
            i.nama, i.gmail,
            look('peranan', i.peranan),
            look('bidang', i.bidang),
            look('klinik', i.poliklinik),
            look('keaktifan', i.keaktifan)
          ])
        )
      ))
    )
  ),

  references: () => !_.includes([2, 5], state.login.bidang) ?
  m('p', 'Hanya untuk user manajemen dan kasir') : m('.content',
    m('h3', 'Daftar Tarif'),
    m('table.table',
      {oncreate: () => db.references.toArray(array => [
        state.referenceList = _.sortBy(array, ['nama']),
        m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama item', 'Harga', 'Grup 1', 'Grup 2', 'Grup 3']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.referenceList &&
        paginate(state.referenceList, 'references', 20)
        .map(i => m('tr', tds([
          i.nama, rupiah(i.harga), i[0], i[1], i[2]
        ])))
      )
    ),
    m('div',comp.pagination(
      'references',
      _.get(state, 'referenceList.length') / 20
    )),
    [
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
            updater => result.data.length < 1001 && ors([
              result.data[0].harga && updater(
                'references', result.data.map(i =>
                  _.merge(i, {_id: randomId(), updated: _.now()})
                )
              ),
              result.data[0].nama_lengkap && updater('patients',
                result.data.map(i => _.merge(
                  {updated: _.now(), _id: randomId()},
                  {identitas: _.merge(
                    {
                      keluarga: {ayah: i.ayah, ibu: i.ibu, pasangan: i.pasangan},
                      kontak: i.kontak, nama_lengkap: _.startCase(i.nama_lengkap),
                      tanggal_input: (new Date(i.tanggal_input)).getTime(),
                      tanggal_lahir: (new Date(i.tanggal_lahir)).getTime(),
                      tempat_lahir: i.tempat_lahir, tempat_tinggal: i.tempat_tinggal,
                    },
                    _.fromPairs(
                      ['agama', 'alias', 'darah', 'kelamin', 'ktp',
                       'nikah', 'no_mr', 'pekerjaan', 'pendidikan']
                      .map(j => +i[j] && [j, +i[j]])
                    )
                  )}
                ))
              ),
              result.data[0].kelas && updater(
                'beds', result.data.map(i =>
                  _.merge(i, {_id: randomId(), updated: _.now()})
                )
              ),
              result.data[0].no_batch && updater('goods',
                result.data.map(i => _.merge(
                  {_id: randomId(), updated: _.now()},
                  {
                    nama: i.nama, jenis: +i.jenis, kandungan: i.kandungan,
                    satuan: +i.satuan, kriteria: {
                      antibiotik: +i.antibiotik, narkotika: +i.narkotika,
                      psikotropika: +i.psikotropika, fornas: +i.fornas
                    },
                    batches: [{
                      idbatch: randomId(), no_batch: i.no_batch, merek: i.merek,
                      masuk: i.masuk && (new Date(i.masuk)).getTime(),
                      kadaluarsa: i.kadaluarsa && (new Date(i.kadaluarsa)).getTime(),
                      stok: {gudang: +i.digudang, apotik: +i.diapotik, retur: +i.diretur},
                      harga: {beli: +i.beli, jual: +i.jual}, returnable: !!i.returnable,
                      sumber: {
                        supplier: i.supplier, anggaran: +i.anggaran, no_spk: i.no_spk,
                        tanggal_spk: i.tanggal_spk && (new Date(i.tanggal_spk)).getTime()
                      }
                    }]
                  }
                ))
              )
            ])
          )
        })},
        m('label.file-label',
          m('input.file-input', {type: 'file', name: 'import'}),
          m('span.file-cta', m('span.file-label', 'Pilih file'))
        ),
        m('p', 'Pastikan jumlah baris data kurang dari 1.000 atau akan ditolak server.')
      )
    ]
  ),

  pagination: (id, length) => [
    state.pagination = state.pagination || _.fromPairs([[
      id, _.get(state.pagination, id) || 0
    ]]),
    m('nav.pagination', m('.pagination-list',
      _.range(length).map(i => m('div', m('a.pagination-link', {
        class: i === state.pagination[id] && 'is-current',
        onclick: () => [
          state.pagination[id] = i, m.redraw()
        ]
      }, i+1)))
    ))
  ][1],
})