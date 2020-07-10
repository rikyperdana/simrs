/*global m _ comp state tds db hari ors look lookUser*/

_.assign(comp, {
  laboratory: () => m('.content',
    m('h1', 'Laboratorium'),
    m('table.table',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.patients.filter(i =>
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.labor') &&
            !j.soapDokter.labor.diagnosa
          ).length
        ).toArray(arr => state.laboratoryList = arr.flatMap(i =>
          [...(i.rawatJalan || []), ...(i.emergency || [])]
          .filter(j =>
            _.get(j, 'soapDokter.labor') &&
            !j.soapDokter.labor.diagnosa
          ).map(j => ({pasien: i, rawat: j}))
        ))
      ]},
      m('thead', m('tr',
        ['Waktu Permintaan', 'No. MR', 'Nama Pasien', 'Instalasi', 'Dokter']
        .map(i => m('th', i))
      )),
      // berbeda dengan radiologi, 1 baris mewakili 1 kali rawat
      m('tbody',
        (state.laboratoryList || []).map(i => m('tr', tds([
          hari(i.rawat.tanggal),
          i.pasien.identitas.no_mr,
          i.pasien.identitas.nama_lengkap,
          ors([
            i.rawat.klinik && look('klinik', i.rawat.klinik),
            i.observasi && 'Rawat Inap',
            'Emergency'
          ]),
          lookUser(i.rawat.soapDokter.dokter)
        ])))
      )
    )
  )
})