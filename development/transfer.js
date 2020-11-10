/*global _ m comp db state autoForm schemas updateBoth lookUser hari makeModal tds ands ors look reports paginate*/

_.assign(comp, {
  transfer: () => !ors([
    _.includes([3, 4], state.login.bidang),
    _.includes([2, 3], state.login.peranan)
  ])
  ? m('p', 'Hanya untuk user farmasi, apotik dan petugas medis')
  : m('.content',
    state.login.peranan === 4 && reports.transfer(),
    m('h3', 'Daftar antrian amprah'),
    m('.box', m('.table-container', m('table.table.is-striped',
      {onupdate: () => [
        db.users.toArray(array =>
          state.userList = array
        ),
        db.goods.toArray(array => [
          state.transferList = array.reduce((a, b) =>
            b.batch ? a.concat(b.batch.reduce((c, d) =>
              d.amprah ? c.concat(d.amprah.reduce((e, f) =>
                e.concat([_.merge(f, {
                  idbarang: b._id, nama_barang: b.nama,
                  idbatch: d.idbatch, no_batch: d.no_batch,
                  digudang: d.stok.gudang
                })])
              , [])) : c
            , [])) : a
          , []), m.redraw()
        ])
      ]},
      m('thead', m('tr',
        ['Nama barang', 'No. Batch', 'Peminta', 'Asal Ruangan', 'Jumlah minta', 'Tanggal diminta']
        .map((i => m('th', i)))
      )),
      m('tbody', state.transferList &&
        state.transferList.map(i => m('tr',
        {onclick: () => [
          state.login.bidang === 3 &&
          _.assign(state, {
            oneAmprah: i, modalResponAmprah: m('.box',
              m('h4', 'Respon permintaan barang'),
              m('.table-container', m('table.table',
                m('thead', m('tr',
                  ['Nama barang', 'No. Batch', 'Stok gudang', 'Jumlah minta']
                  .map(j => m('th', j))
                )),
                m('tbody', m('tr', tds([
                  i.nama_barang, i.no_batch, i.digudang, i.diminta
                ])))
              )),
              m(autoForm({
                id: 'formResponAmprah', schema: schemas.responAmprah,
                action: doc => [
                  db.goods.get(i.idbarang, barang => [
                    updateBoth('goods', i.idbarang, _.assign(barang, {batch:
                      barang.batch.map(a =>
                        a.idbatch === i.idbatch ? _.assign(a, {
                          stok: {
                            gudang: a.stok.gudang - doc.diserah,
                            apotik:
                              state.oneAmprah.ruangan === 4
                              ? (a.stok.apotik || 0) + doc.diserah
                              : a.stok.apotik
                          },
                          amprah: a.amprah.map(b =>
                            b.idamprah === i.idamprah ?
                            _.assign(b, doc) : b
                          )
                        }) : a
                      )
                    })),
                    state.modalResponAmprah = null,
                    m.redraw()
                  ]),
                  state.goodsList = null, m.redraw()
                ]
              }))
            )
          }),
          m.redraw()
        ]},
        !i.penyerah && tds([
          i.nama_barang, i.no_batch, lookUser(i.peminta),
          look('bidang', i.ruangan), i.diminta, hari(i.tanggal_minta, true)
        ])
      ))),
      makeModal('modalResponAmprah')
    ))),
    m('p'),
    m('h3', 'Daftar riwayat amprah'),
    m('.box', m('.table-container', m('table.table.is-striped',
      m('thead', m('tr',
        ['Nama barang', 'No. Batch', 'Peminta', 'Jumlah minta', 'Tanggal diminta', 'Penyerah', 'Jumlah serah', 'Tanggal serah']
        .map(i => m('th', i))
      )),
      m('tbody',
        paginate(state.transferList || [], 'transferList', 100)
        .sort((a, b) => b.tanggal_serah - a.tanggal_serah)
        .map(i => m('tr',
          i.penyerah && tds([
            i.nama_barang, i.no_batch,
            lookUser(i.peminta), i.diminta, hari(i.tanggal_minta, true),
            lookUser(i.penyerah), i.diserah, hari(i.tanggal_serah, true)
          ])
        ))
      )
    ))),
    m('div',comp.pagination(
      'transferList',
      _.get(state, 'transferList.length') / 100
    )),
  )
})
