# Panduan Pengujian Sistem
Ini adalah daftar cara pengujian sistem untuk memastikan seluruh fungsi berjalan dengan benar dan menemukan bug.
Laporan dari pengujian ini bisa ditulis langsung pada bagian comment. Jika laporan ditulis dalam dokumen terpisah
maka harap cantumkan nama pelapor, tanggal laporan, dan daftar bugs yang ditemukan (yang berjalan normal tidak perlu).

## Login & Menu
- Coba login dengan username/password yang salah : Pastikan tampil notifikasi 'Password salah' dan user tetap di halaman login
- Jika login berhasil, coba refresh halaman: Pastikan status login tetap terjaga dan tidak hilang
- Jika login sebagai pendaftaran: Pastikan hanya bisa akses menu Pendaftaran, tidak ada yg lain
- Jika login sebagai kasir: Pastikan bisa masuk menu kasir dan manajemen>referensi
- Jika login sebagai dokter/perawat: Pastikan bisa masuk menu IGD, Rawat Jalan, Rawat Inap, Gudang, dan Manajemen>Referensi
- Jika login sebagai apoteker: Pastikan bisa masuk menu Apotik dan Gudang
- Jika login sebagai gudang farmasi: Pastikan hanya bisa masuk menu Gudang
- Jika login sebagai manajemen: Pastikan hanya bisa masuk menu Manajemen & Referensi
- Klik username pada baris menu atas, masuk halaman profil: Coba update informasi akun dan pastikan berhasil

## Pendaftaran
- Coba daftarkan 1 pasien baru: Pastikan halaman Rekam Medis menampilkan informasi yang benar
- Coba cari salah satu pasien dengan menggunakan nama atau No. MR: Pastikan hasil pencarian tidak ada yang janggal
- Pada halaman Rekam medis, coba daftarkan ia berobat ke salah satu poliklinik dengan cara bayar Umum
: Pastikan namanya tampil pada halaman menu kasir (silahkan ganti login ke kasir)
- Pada halaman Rekam medis, coba daftarkan ia berobat ke salah satu poliklinik dengan cara bayar BPJS
: Pastikan namanya langsung tampil pada halaman Rawat jalan pada poliklinik yang bersangkutan (silahkan ganti login ke perawat/dokter)
- Coba update informasi identitas salah satu pasien: Pastikan informasi yang tersimpan sesuai yang diisikan
- Coba klik print General Consent dan Cetak Kartu: Pastikan pdf bisa didownload dan tampil dengan baik
- Pada halaman Rekam medis, coba daftarkan ia berobat ke IGD/Emergency
: Pastikan namanya tercantum pada menu IGD (silahkan ganti login ke perawat/dokter)

## IGD

## Rawat Jalan

## Rawat Inap

## Kasir

## Apotik

## Gudang

## Maanajemen