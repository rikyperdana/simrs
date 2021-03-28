var kop = {
  text: 'RUMAH SAKIT MEDICARE\nJL. Dt. Laksamana No. 1, Pangkalan Kuras, Pelalawan, Provinsi Riau.\n\n',
  alignment: 'center', bold: true
}, namaRS = 'RS Medicare', letakRS = 'Pangkalan Kuras', // kota/kabupaten/desa lokasi RS
tarifIGD = 45000, tarifKartu = 8000, // dalam rupiah
kodepoli =     ['int',            'ana',  'obg',   'bed',   'gig'         ], // referensi INACBGs
klinik =       ['penyakit_dalam', 'anak', 'obgyn', 'bedah', 'gigi', 'umum'], // poliklinik yg tersedia
tarif_klinik = [ 95,               95,     95,      95,      95,     45   ], // dalam ribu rupiah, sejajarkan dengan klinik atasnya
beds = { // tarif dalam ribu rupiah
  vip: {tarif: 350, kamar: {tulip: 1, bougenvil: 1, sakura: 1}}, // jumlah bed pada masing2 kamar
  kl1: {tarif: 200, kamar: {kenanga: 2, cempaka: 2, claudia: 2, ferbia: 2, yasmin: 2, edelwise: 2}},
  kl2: {tarif: 150, kamar: {seroja: 3, mawar: 2, dahlia: 2, lili: 2, zahara: 2, matahari: 4}},
  kl3: {tarif: 100, kamar: {anggrek: 4, teratai: 7, kertas: 3, melati: 5}}
},
defaultTheme = 'default'
