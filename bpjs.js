var bpjs = (req, res) => res.send({
  getToken: () => [
    req.headers.username, // admin
    req.headers.password // abc123
  ].every(i => i) && {token: '123123123123123123'},

  getNoAntrean: () => [
    req.headers.token,
    req.headers.nomorkartu, // 0000000000000123
    req.headers.nik, // 1471071611890001
    req.headers.notelp, // 08117696000
    req.headers.tanggalperiksa, // "2019-12-11"
    req.headers.kodepoli, // "001", panduan ada di gSheets
    req.headers.nomorreferensi, // "0001R0040116A000001"
    req.headers.jenisreferensi, // 1, {1: rujukan, 2: kontrol}
    req.headers.jenisrequest, // 2, {1: pendaftaran, 2: poli}
    req.headers.polieksekutif // 0, {1: eksekutif, 2: reguler}
  ].every(i => i) && {
    noantran: 'A10', kodebooking: 'QWERTYUIO123',
    estimasidilayani: 1583381957229,
    namapoli: 'Poli Jantung',
    jenisantrean: 1, // {1: pendaftaran, 2: poli}
    namadokter: 'Dr. Bayu Asmara' // optional
  },

  getRekapAntrean: () => [
    req.headers.token,
    req.headers.tanggalperiksa,
    req.headers.kodepoli,
    req.headers.polieksekutif
  ].every(i => i) && {
    namapoli: 'satu', totalantrean: 'dua',
    jumlahterlayani: 'tiga', lastupdate: 'empat'
  },

  getKodeBookingOperasi: () => [
    req.headers.token,
    req.headers.nopeserta // "000000000000123"
  ].every(i => i) && {list: [{
    kodebooking: '123456ZXC',
    tanggaloperasi: '2019-12-11',
    jenistindakan: 'operasi gigi',
    kodepoli: '001',
    namapoli: 'Poli Bedah Mulut',
    terlaksana: 0 // hanya yg belum terlaksana
  }]},

  getJadwalOperasi: () => true && {list: [{
    kodebooking: 'satu', tanggaloperasi: 'dua',
    jenistindakan: 'tiga', kodepoli: 'empat',
    namapoli: 'lima', terlaksana: 'enam',
    nopeserta: 'tujuh', lastupdate: 'delapan'
  }]}
}[req.headers.api]())

exports.bpjs = bpjs