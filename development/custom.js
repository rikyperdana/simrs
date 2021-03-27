var kop = {
  text: 'RUMAH SAKIT MEDICARE\nJL. Dt. Laksamana No. 1, Pangkalan Kuras, Pelalawan, Provinsi Riau.\n\n',
  alignment: 'center', bold: true
}, kotaRS = 'Pangkalan Kuras',
tarifIGD = 45000, tarifKartu = 8000,
klinik =       ['penyakit_dalam', 'anak', 'obgyn', 'bedah', 'gigi', 'umum'],
tarif_klinik = [ 95,               95,     95,      95,      95,     45   ], // dalam ribu rupiah, sejajarkan dengan klinik atasnya
beds = {
  vip: {tarif: 350, kamar: {tulip: 1, bougenvil: 1, sakura: 1}},
  kl1: {tarif: 200, kamar: {kenanga: 2, cempaka: 2, claudia: 2, ferbia: 2, yasmin: 2, edelwise: 2}},
  kl2: {tarif: 150, kamar: {seroja: 3, mawar: 2, dahlia: 2, lili: 2, zahara: 2, matahari: 4}},
  kl3: {tarif: 100, kamar: {anggrek: 4, teratai: 7, kertas: 3, melati: 5}}
}
