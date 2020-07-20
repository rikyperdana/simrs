/*global _ m makeReport withThis moment db makePdf hari look rupiah tarifIGD lookReferences*/

var reports = {
  cashier: () => makeReport(
    'Penerimaan Kasir (Poli & IGD)', e => withThis(
      ({
        start: +moment(e.target[0].value),
        end: +moment(e.target[1].value)
      }),
      date => [
        e.preventDefault(),
        db.patients.toArray(array => makePdf.report(
          'Penerimaan Kasir (Poli & IGD)',
          [['Tanggal', 'Poliklinik', 'No. MR', 'Nama Pasien', 'Konsultasi', 'Obat', 'Tindakan', 'Jumlah']].concat(
            _.flattenDeep(array.map(
              i => ([]).concat(i.rawatJalan || [],i.emergency || [])
              .map(j => j.bayar_konsultasi && {pasien: i, rawat: j})
              .filter(Boolean)
            ).filter(l => l.length))
            .sort((a, b) => a.rawat.tanggal - b.rawat.tanggal)
            .map(i => [
              hari(i.rawat.tanggal),
              !i.rawat.klinik ? 'IGD' :
              look('klinik', i.rawat.klinik),
              String(i.pasien.identitas.no_mr),
              i.pasien.identitas.nama_lengkap,
              rupiah(
                !i.rawat.klinik ? tarifIGD :
                +look('tarif_klinik', i.rawat.klinik)*1000
              ),
              rupiah(i.rawat.soapDokter.obat ? _.sum(
                i.rawat.soapDokter.obat.map(j => j.harga)
              ) : 0),
              rupiah(i.rawat.soapDokter.tindakan ? _.sum(
                i.rawat.soapDokter.tindakan.map(
                  j => +lookReferences(j.idtindakan).harga
                )
              ) : 0),
              rupiah(_.sum([
                !i.rawat.klinik ? tarifIGD :
                +look('tarif_klinik', i.rawat.klinik)*1000,
                i.rawat.soapDokter.obat ? _.sum(
                  i.rawat.soapDokter.obat.map(j => j.harga)
                ) : 0,
                i.rawat.soapDokter.tindakan ? _.sum(
                  i.rawat.soapDokter.tindakan.map(
                    j => +lookReferences(j.idtindakan).harga
                  )
                ) : 0
              ]))
            ])
          )
        ))
      ]
    )),
}