/*global _ m comp state db tds hari lookReferences moment*/

_.assign(comp, {
  surgery: () => m('.content',
    m('h1', 'Jadwal Instalasi Bedah'),
    m('table.table',
      {
        oncreate: () =>
          db.references.toArray(array => state.references = array),
        onupdate: () =>
          db.patients.toArray(array => state.surgeryList = array.map(i =>
            ([]).concat(i.rawatJalan, i.emergency).flatMap(j =>
              j && j.soapDokter && j.soapDokter.tindakan &&
              j.soapDokter.tindakan.map(k =>
                (k.jadwal > +moment()) && _.merge(i, j, k)
              ).filter(Boolean)
            ).filter(Boolean)
          ).filter(x => x.length))
      },
      m('tr', ['Nama Pasien', 'Jadwal Operasi', 'Nama Tindakan'].map(i => m('th', i))),
      state.surgeryList && _.flatten(state.surgeryList).map(i => m('tr', tds([
        i.identitas.nama_lengkap,
        hari(i.jadwal, true),
        lookReferences(i.idtindakan).nama
      ])))
    )
  )
})