/*global _ state*/

var selects = name => _.reduce(
  {
    alias: ['tn', 'ny', 'nn', 'an', 'by'],
    kelamin: ['laki-laki', 'perempuan'],
    agama: ['islam', 'katolik', 'protestan', 'budha', 'hindu', 'konghuchu'],
    nikah: ['nikah', 'belum_nikah', 'janda', 'duda'],
    pendidikan: ['sd', 'smp', 'sma', 'diploma', 's1', 's2', 's3', 'tidak_sekolah'],
    darah: ['a', 'b', 'ab', 'o'],
    pekerjaan: ['pns', 'swasta', 'wiraswasta', 'tni', 'polri', 'pensiunan', 'lainnya'],
    cara_bayar: ['umum', 'bpjs', 'asuransi'],
    kodepoli:     ['int',            'ana',  'obg',   'bed',   'gig'],
    klinik:       ['penyakit_dalam', 'anak', 'obgyn', 'bedah', 'gigi', 'umum'],
    tarif_klinik: [ 95,               95,     95,      95,      95,     45],
    rujukan: ['datang_sendiri', 'rs_lain', 'puskesmas', 'faskes_lainnya'],
    keluar: ['pulang', 'rujuk', 'inap'],
    jenis_barang: ['Obat', 'BHP', 'Logistik'],
    satuan: ['botol', 'vial', 'ampul', 'pcs', 'sachet', 'tube', 'supp', 'tablet', 'minidose', 'pot', 'turbuhaler', 'kaplet', 'kapsul', 'bag', 'pen', 'rectal', 'flash', 'cream', 'nebu', 'galon', 'lembar', 'roll', 'liter', 'cup', 'pasang', 'bungkus', 'box', 'syringe'],
    boolean: ['ya', 'tidak'],
    konfirmasi: ['proses', 'tolak'],
    peranan: ['petugas', 'perawat', 'dokter', 'admin'],
    bidang: ['pendaftaran', 'kasir', 'farmasi', 'apotik', 'manajemen', 'rawat_jalan', 'rawat_inap', 'laboratorium', 'radiologi'],
    keaktifan: ['aktif', 'non-aktif'],
    pengarsipan: ['Rumah Sakit', 'Pribadi']
  }, (res, inc, key) =>
    _.merge(res, {[key]: () => _.map(inc, (val, key) =>
        ({label: _.startCase(val), value: key+1})
      )})
  , {}
)[name],

look = (category, value) => _.get(
  selects(category)().filter((i, j) =>
    j+1 === value
  )[0], 'label'
) || '-',

lookGoods = _id =>
  _id && state.goodsList
  .filter(i => i._id === _id)[0],

lookReferences = _id =>
  _id && state.references
  .filter(i => i._id === _id)[0],

lookUser = _id =>
  _id && state.userList
  .filter(i => i._id === _id)[0].nama