
# Panduan Pengujian Sistem
Ini adalah daftar cara pengujian sistem untuk memastikan seluruh fungsi berjalan dengan benar dan menemukan bug.
Laporan dari pengujian ini bisa ditulis langsung pada menu 'Issues'. Jika laporan ditulis dalam dokumen terpisah
maka harap cantumkan nama pelapor, tanggal laporan, dan daftar bugs yang ditemukan (yang berjalan normal tidak perlu).
Perlu diingat, pengujian sistem seperti ini hanya boleh dilakukan pada server testing. Melakukannya pada server production
akan berakibat fatal terhadap data yang ada.

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
- Login sebagai admin pendaftaran, cari dan buka salah satu pasien, coba hapus salah satu riwayat rawat
: Pastikan riwayat yang dihapus tersebut tidak muncul kembali

## IGD
- Melalui akun pendaftaran coba daftarkan 1 seorang pasien lama ke IGD
: Pastikan nama pasien tersebut muncul pada daftar dalam menu IGD
- Login sebagai perawat dan isikan SOAP Perawat pada pasien yang dilayani
- Login sebagai dokter dan isikan SOAP Dokter pada pasien yang dilayani
: Pastikan nama perawat dan/atau dokter yang mengisikan SOAP pada baris riwayat tersebut
- Login sebagai Kasir dan pastikan seluruh item berbiaya yang digunakan selama layanan IGD tertampil pada rincian tagihan
- Login sebagai Admin IGD dan coba hapus salah satu riwayat rawat IGD (contoh skenario pasien batal dilayani IGD)

## Rawat Jalan
- Melalui akun pendaftaran coba daftarkan seorang pasien lama ke salah satu Poliklinik
: Pastikan nama pasien tersebut muncul dalam daftar antrian poli bersangkutan
- Jika uji coba menggunakan skenario pembayaran Umum:
: Pastikan nama pasien tersebut tercantum pada daftar antrian bayar menu Kasir
- Login sebagai perawat untuk poliklinik tersebut, coba masukkan informasi SOAP Perawat secara lengkap
: Pastikan seluruh informasi yang diisikan perawat tercantum pada modal Rincian Rawat
- Login sebagai dokter untuk poliklinik tersebut, coba masukkan informasi SOAP Dokter secara lengkap
: Pastikan seluruh informasi yang diisikan dokter tercantum pada modal Rincian Rawat
- Tes cetak SOAP dan pastikan isi pdfnya mengandung seluruh informasi yang diinputkan/diharapkan
- Login sebagai Admin Rawat Jalan, buka salah satu pasien, coba hapus 1 riwayat rawat jalan

## Rawat Inap
- Login sebagai dokter poliklinik manapun, coba buka 1 pasien yang sedang aktif, isikan SOAP Dokter, pada field 'Keluar'
pilih 'Inap', simpan : Pastikan nama pasien tersebut tercantum pada daftar admisi menu Rawat Inap
- Login sebagai perawat/dokter, buka menu Rawat Inap, dari daftar admisi, tunjukan pasien kepada salah satu kamar, simpan
: Pastikan nama pasien tersebut hilang dari daftar admisi dan berpindah ke daftar pasien yang sedang diinapkan berikut kode kamarnya
- Double-klik pada salah satu riwayat rawat, double-klik pada salah satu riwayat rawat, coba tambahkan observasi
- Double-klik pada salah satu item observasi untuk melihat rincian observasi tersebut
: Pastikan seluruh informasi yang diisikan/diharapkan, tersedia pada Rincian Observasi tersebut
- Coba double-klik 'Pulangkan pasien' untuk menutup akses input observasi baru ke riwayat rawat tersebut

## Kasir
- Coba test terima pembayaran untuk skenario Rawat Jalan, IGD, dan Rawat Inap
- Coba test terima pembayaran yang menghandung tagihan tindakan dan/atau obat
- Jika fitur openBeta aktif, coba test terima pembayaran yang mengandung tagihan labor & radiologi
- Coba skenario penambahan 'Biaya lainnya' dan cek rincian biaya setelah penambahan
- Login sebagai Admin Kasir, coba gunakan menu laporan untuk lihat hasil pdfnya

## Apotik
- Klik salah satu baris, coba test cetak 'Salinan Resep', dan test 'Serahkan'
: Pastikan obat yang tercantum pada pdf salinan resep sama dengan yang tertampil pada modal
- Coba test 'Batal serah' untuk menghilangkan request dari daftar
- Buka menu 'Storage', pilih salah satu barang, pilih salah satu batch, test input angka amprah
: Pastikan jumlah permintaan muncul pada modal rincian batch dan pada menu 'Storage'>'Amprah'

## Gudang
- Coba test cari salah satu barang, dan update informasinya
: Pastikan informasi yang muncul pada halaman rincian barang sesuai dengan informasi yang diperbaharui
- Coba test tambahkan jenis barang
: Pastikan barang tersebut muncul pada daftar barang
- Buka menu amprah, klik pada salah satu baris permintaan barang, input sejumlah angka
: Pastikan baris permintaan tersebut hilang dan sudah muncul pada riwayat penyerahan barang

## Manajemen
- Coba test buat akun baru dengan peranan dan bidang yang berbeda-beda
: Pastikan akun tersebut muncul dalam daftar user sistem
- Coba test update informasi salah satu akun (ganti nama, username, password, bidang, peranan, dll)
: Pastikan akun tersebut menyimpan informasi yang telah diperbaharui

## Laboratorium
Untuk menggunakan menu ini, harap aktifkan 'openBeta' pada menu profil masing-masing user.
Menu laboratorium hanya bisa diakses oleh tenaga medis (perawat/dokter)
- Dari halaman SOAP Dokter, masukkan permintaan jenis laboratorium dari baris dropdown, dan submit
: Pastikan item laboratorium yang diminta muncul pada menu 'Radiologi'.
Coba skenario pada 3 jenis layanan (Rawat Jalan, IGD, Rawat Inap)
- Pada salah satu item request laboratorium, konfirmasi permintaan dan submit
: Pastikan pada baris yang diupdate muncul informasi 'Diproses' yang bernilai tanggal
- Pada salah satu item request laboratorium berstatus 'Diproses', isikan form hasil, dan submit
: Pastikan item request laboratorium tersebut tidak muncul lagi pada menu laboratorium

## Radiologi
Untuk menggunakan menu ini, harap aktifkan 'openBeta' pada menu profil masing-masing user.
Menu radiologi hanya bisa diakses oleh tenaga medis (perawat/dokter)
- Dari halaman SOAP Dokter, masukkan permintaan jenis radiologi dari baris dropdown, dan submit
: Pastikan item radiologi yang diminta muncul pada menu 'Radiologi'.
Coba skenario pada 3 jenis layanan (Rawat Jalan, IGD, Rawat Inap)
- Pada salah satu item request radiologi, konfirmasi permintaan dan submit
: Pastikan pada baris yang diupdate muncul informasi 'Diproses' yang bernilai tanggal
- Pada salah satu item request radiologi berstatus 'Diproses', isikan form hasil, dan submit
: Pastikan item request radiologi tersebut tidak muncul lagi pada menu radiologi