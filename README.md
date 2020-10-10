# SIMRS.dev
> SIMRS Open Source Terintegrasi Pertama yang menggunakan NodeJS + MongoDB

Bismillahirrahmanirrahim,

## Update!
- Pembagian kolom pada seluruh form seperti di [screenshots](https://github.com/rikyperdana/simrs/issues/118)

## Pengenalan
SIMRS.dev adalah Sistem Informasi Rumah Sakit Terintegrasi, yang menandakan bahwa sistem ini mencakup fungsi umum yang terdapat pada rumah sakit seperti Rawat Jalan, IGD, Rawat Inap, Apotik, Farmasi, Amprahan, Manajemen, Radiologi, Laboratorium, Gizi, dsb. Sistem ini menggunakan 1 database yang saling menghubungkan fungsi tersebut dengan otomatisasi sehingga memungkinkan rumah sakit untuk menjalankan sistem ini secara paperless maupun hybrid dengan dokumen fisiknya.

## Screenshots
![dashboard](https://user-images.githubusercontent.com/11875540/93850151-b8fd5600-fcd7-11ea-982b-4813d78e20de.png)

|Rekam Medis|Gudang Farmasi|
|-----------|--------------|
|![rekam_medis](https://user-images.githubusercontent.com/11875540/93850166-bf8bcd80-fcd7-11ea-9e62-f353c0ae9359.png)|![storage](https://user-images.githubusercontent.com/11875540/93971379-40ab9900-fd9a-11ea-86e7-a1f7879badb1.png)|

|Dark Mode|Purple Light|
|---------|------------|
|![dark_mode](https://user-images.githubusercontent.com/11875540/93850181-c581ae80-fcd7-11ea-912c-d78f787659c8.png)|![purple_light](https://user-images.githubusercontent.com/11875540/93850188-c9adcc00-fcd7-11ea-89f4-097be6129550.png)|

|Default|Dark Mode|Other Themes|
|-------|---------|------------|
| <img src="https://user-images.githubusercontent.com/11875540/93853623-61aeb400-fcde-11ea-9d5c-5d369819ab54.png" alt="drawing" width="200"/> | <img src="https://user-images.githubusercontent.com/11875540/93853638-6a06ef00-fcde-11ea-8a2d-2bdfb7dcfefd.png" alt="drawing" width="200"/> | <img src="https://user-images.githubusercontent.com/11875540/93853746-a0dd0500-fcde-11ea-9be8-4fa6e7303ead.png" alt="drawing" width="200"/> |

Sistem ini dibangun dengan menggunakan spesifikasi sebagai berikut:

|Teknologi|Keterangan|
|--|--|
|Bahasa|Javascript ES6|
|Server|Node 12.18.1|
|Paradigma|Functional|
|Backend|Express 4.16.4|
|Database|MongoDB 3.3.3|
|Frontend|Mithril JS 2.0.4|
|CSS|Bulma 0.7.5|

## Persiapan Pra-install
1. Paham tentang [MongoDB](https://docs.mongodb.com/) dan [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Paham tentang paradigma
[Functional](https://eloquentjavascript.net/1st_edition/chapter6.html)
[Javascript ES6](http://es6-features.org/#DefaultParameterValues),
[MithrilJS](https://mithril.js.org/), [Lodash](https://lodash.com/docs/4.17.15),
[Bulma](https://bulma.io/), dan
[DexieJS](https://dexie.org/)
3. Paham tentang ragam prosedur operasional Rumah Sakit Umum
4. Bila ingin menggunakan Glitch: Buat akun [Glitch](https://glitch.com/) dan [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
5. Bila ingin instalasi lokal (PC/Laptop): Install [Node JS](https://nodejs.org/en/download/) dan [Mongo DB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)

## Cara Install

### Bagian App (jika dari Glitch)
1. Clone project ini dari halaman [Glitch](https://glitch.com/~simrs), rename nama project bila diperlukan

### Bagian App (jika dari NodeJS)
1. `git clone https://github.com/rikyperdana/simrs`
2. `npm install`
3. `node server.js`

### Bagian DB
1. Login MongoDB Atlas, create Free cluster, klik create cluster
2. Pada halaman MongoDB Atlas, bagian Cluster, klik Connect
3. Klik Connect your Application
4. Pilih MongoDB version 2.2.12 or later
5. Klik Copy pada Connection String Only
6. Pada halaman MongoDB Atlas Cluster, create database "simrs" (atau nama lainnya).
7. Masih pada halaman Cluster, tambahkan dibawah db tersebut 5 collection `goods, patients, references, users, queue`
8. Buat file pada folder project bernama `.env` (jika belum ada). Isikan dengan:
```
MONGO="isikan dengan connection string, dan ganti <username> dan <password>"
dbname="nama databasenya"
```
Bila tidak ingin menggunakan Atlas, silahkan ganti nilai variabel `MONGO="alamat lokal"`
dengan alamat server database local Anda

### Bagian Manajemen
1. Login dengan username 'admin' password 'admin'
2. Segera buat akun admin baru dan non-aktifkan akun admin bawaan
3. Unduh dan ganti isi [Daftar tarif tindakan](https://docs.google.com/spreadsheets/d/1jtkgvq5SgWsljqtk0ZxkPW4fV-eZlAy5EjkzU41flSQ/edit?usp=sharing), simpan sebagai .csv dan unggah melalui tombol Import
4. Selamat mengikuti video tutorial pada playlist youtube berikut ini [Playlist Tutorial Pemakaian SIMRS.dev Open Source](https://www.youtube.com/playlist?list=PL4oE8OvUySlyxLt2G6zROOCvrjeeXxNMR)

## Cara Menjalankan
### Development
1. `nodemon server.js`
### Production
1. Pada .env berikan `production=true` (jika belum ada)
2. `npm run bundle` (setiap kali pindah ke mode production)
3. `node server.js`

## Deskripsi Menu & Sub-menu

### Manajemen

#### Pengguna
<img align="left" src="https://user-images.githubusercontent.com/11875540/94102143-a0b64400-fe5b-11ea-8e94-486d6b01badb.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh admin untuk mendaftarkan users yang akan nantinya akan menggunakan sistem. Klik tambah akun dan isikan informasi seperti nama lengkap, username, dan peranannya. Berikutnya sistem akan mengenali user berdasarkan username yang digunakan untuk login dan memberikan hak akses sesuai dengan peranan yang ditetapkan oleh admin.

___
#### Referensi
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101410-f7bb1980-fe59-11ea-9cf2-4aef66270d2b.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh admin untuk mendaftarkan tarif tindakan, laboratorium, dan radiologi ke dalam sistem dengan menggunakan file .csv seperti pada file [contoh](https://drive.google.com/open?id=1jtkgvq5SgWsljqtk0ZxkPW4fV-eZlAy5EjkzU41flSQ). Silahkan hapus seluruh baris kecuali header pertama dan ganti isinya sesuai dengan tarif pada faskes Anda. Setelah import berhasil, silahkan refresh browser.

___
#### Database
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101392-effb7500-fe59-11ea-971a-16b6b4e09de2.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh admin manajemen untuk melakukan backup secara berkala sesuai kebutuhan dan restore database untuk mengembalikan database ke kondisi tertentu. Juga tersedia menu Import data untuk pasien, barang, referensi, dan user.
___
### Pendaftaran
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101381-e96cfd80-fe59-11ea-9823-bcbdd4eacbc0.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh user Pendaftaran untuk melakukan pembaharuan identitas pasien, registrasi pasien baru dan mendaftarkan pasien ke poliklinik tertentu, ataupun ke layanan IGD. Tersedia tombol untuk mencetak kartu pasien dan general consent. Kepada Admin Pendaftaran dibukakan akses untuk menghapus item riwayat layanan poliklinik dan IGD (untuk skenario pasien membatalkan layanan rawatnya).

___
### Emergency Unit
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101361-de19d200-fe59-11ea-8c84-07aeaf2cb143.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh seluruh tenaga medis (perawat/dokter) untuk mengisikan informasi SOAP baik khusus perawat maupun khusus dokter. Kepada level Admin disediakan menu untuk mencetak laporan kunjungan IGD.

___
### Rawat Jalan
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101348-d823f100-fe59-11ea-9940-740a1213f361.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh seluruh tenaga medis (perawat/dokter) untuk melayani pasien yang didaftarkan pada masing-masing poliklinik yang merupakan kelompok/bidang dari tenaga medis tersebut. Tersedia daftar antrian poliklinik, halaman rekam medis, daftar riwayat layanan, form SOAP perawat & dokter, dan tombol cetak pdf SOAP. Kepada level Admin disediakan menu untuk mencetak laporan kunjungan poliklinik tersebut.

___
### Rawat Inap
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101265-bfb3d680-fe59-11ea-8971-0117dd154e81.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh seluruh tenaga medis (perawat/dokter) untuk melayani pasien yang butuh diadmisi ke rawat inap dan yang telah ditempatkan pada bed. Pada rincian rawat inap, tersedia baris observasi yang bisa ditambah dan diisi dengan SOAP perawat/dokter, berikut dengan tombol untuk memulangkan pasien.
Pemetaan ketersediaan bed rawat inap dapat diubah pada file `public/inpatient.js` dalam variabel `beds`. Dengan struktur:
`{kelas: {tarif, kamar: {nama_kamar: jumlah_bed}}}`

___
### Kasir
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101247-b9bdf580-fe59-11ea-9a33-b0d25ef5f317.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh user Kasir untuk menerima daftar tagihan yang muncul dari poliklinik, IGD, dan Rawat Inap. Pada rincian biaya user Kasir juga dapat menambahkan biaya lainnya yang tidak tercakup didalam sistem secara otomatis. Kepada Admin disediakan menu untuk mencetak laporan penerimaan kas yang bersumber dari seluruh layanan yang disediakan.

___
### Storage
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101231-af036080-fe59-11ea-9702-ee58633fb04f.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh user gudang, apoteker, dan tenaga medis dengan level akses yang berbeda-beda. Seorang user gudang dapat memperbaharui data barang, menambahkan jenis barang baru, menambah beberapa batch atas barang tersebut, melakukan retur stok, melakukan stok opname atau jenis barang tertentu, dan merespon request amprah dari apotik dan instalasi lainnya. User apotik dan tenaga medis instalasi dapat mengakses menu ini untuk meninjau ketersediaan stok, menambah request amprah atas batch tertentu, dan melihat riwayatnya.

___
#### Amprah
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101202-a3179e80-fe59-11ea-8e62-22c72ebea4ed.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan bersama oleh petugas farmasi, apotik, dan seluruh instalasi medis lainnya untuk melakukan permintaan/penyerahan atau mutasi barang. Peminta dapat memilih barang dan batch yang diinginkan, mengetikkan jumlah yang diminta, yang akan direspon oleh gudang farmasi untuk penyerahannya.

___
### Apotik
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101172-93985580-fe59-11ea-88d1-e8893acef157.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh user apotik untuk mengeksekusi instruksi penyerahan obat dari resep dokter ke pasien dengan cara yang terotomatisasi oleh sistem. User apotik dapat memantau stok dan me-request mutasi barang dari gudang farmasi ke apotik melalui menu Storage dan Amprah. Apoteker juga dapat melakukan penjualan bebas atas pilihan obat yang tersedia melalui menu penjualan obat.

___
### Radiologi
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101129-782d4a80-fe59-11ea-95b6-c7facfc0d924.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh petugas radiologi untuk menerima permintaan uji radiologi bagi pasien tertentu. Proses respon terdiri dari 2 tahap, dimana yang pertama adalah untuk menyatakan bahwa pasien sudah diproses oleh instalasi radiologi, dan tahap kedua dimana proses uji selesai dan hasil diagnosa radiologist diisikan pada form untuk dicetakkan dan dilampirkan otomatis secara digital ke SOAP dokter yang meminta tersebut.

___
### Laboratorium
<img align="left" src="https://user-images.githubusercontent.com/11875540/94101146-83807600-fe59-11ea-890c-14cb6b9c4a37.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh petugas radiologi untuk menerima permintaan uji labor bagi pasien tertentu. Proses respon terdiri dari 2 tahapan, dimana yang pertama adalah untuk menyatakan bahwa pasien sudah diproses oleh instalasi laboratorium, dan tahap kedua dimana proses uji selesai dan hasil diagnosa laborist diisikan pada form untuk dicetakkan dan dilampirkan secara otomatis ke SOAP dokter yang meminta tersebut.

___
### ICD 10 & 9-CM
<img align="left" src="https://user-images.githubusercontent.com/11875540/94105244-11149380-fe63-11ea-80ac-d6b440f6469c.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh petugas kodifikasi/casemix untuk melakukan kodifikasi atas diagnosa maupun tindakan yang telah diisikan oleh dokter pada SOAP digital. Hasil SOAP yang sudah diisikan oleh petugas dapat dicetak oleh admin pendaftaran yang dapat membuka halaman rekam medis pasien tertentu.

___
### Gizi
<img align="left" src="https://user-images.githubusercontent.com/11875540/94105032-9d728680-fe62-11ea-8c44-faf4ce7309c0.png" alt="drawing" width="200"/> Adalah menu yang dapat digunakan oleh instalasi gizi untuk menerima informasi kebutuhan nutrisi pasien yang sedang dirawat di instalasi rawat inap rumah sakit. Pada menu ini petugas instalasi gizi tidak perlu menginputkan informasi apapun, karena sistem akan secara otomatis menunjukkan pasien mana yang sedang menginap dan pada bed mana.

___

## Wiki
- [Question and Answers](https://github.com/rikyperdana/simrs/wiki/Question-and-Answers)
- [Theme Gallery](https://github.com/rikyperdana/simrs/wiki/Theme-Gallery)
- [Code Structure](https://github.com/rikyperdana/simrs/wiki/Code-Structure)
- [Data Structure](https://github.com/rikyperdana/simrs/wiki/Data-Structure)
- [Testing Guide](https://github.com/rikyperdana/simrs/wiki/Testing-Guide)
- [Import Data Master](https://github.com/rikyperdana/simrs/wiki/Import-Master-Data)
- [Backup and Restore](https://github.com/rikyperdana/simrs/wiki/Backup-and-Restore)
- [Enterprise Edition](https://github.com/rikyperdana/simrs/wiki/Enterprise-edition)

## Integrasi/Bridging BPJS
Buka halaman project [WSBPJS](https://github.com/rikyperdana/wsbpjs)

## Lisensi
Aplikasi SIMRS.dev ini dirancang terbuka untuk umum. Boleh digunakan secara bebas untuk tujuan edukasi perguruan tinggi.
Harus mendapatkan izin hak guna komersil/produksi bagi Rumah Sakit yang ingin menggunakan.
Pengurusan izin hak guna dapat direquest ke Prog. Studi Manajemen, FEB, Universitas Muhammadiyah Riau.
Kampus Utama. Jalan Tuanku Tambusai, Kota Pekanbaru, Provinsi Riau. Surel: umri@umri.ac.id.
Aplikasi ini telah dilindungi Hak Cipta yang terdaftar di Kemenkumham sejak Feb 2019.

Setiap clone dari aplikasi ini tercatat pada server pengelola, harap bekerjasama.
Kode unik registrasi hak cipta: EC00201930994.
Lampiran [Hak Cipta](https://drive.google.com/file/d/1WvzHdWEZrsszxUD1txK-30fEtaVax8g0/view?usp=sharing)

## Keterbatasan
- Sistem ini dirancang hanya mendukung pencatatan stok untuk 1 Gudang dan 1 Apotik

## Pengembangan
- Aplikasi khusus untuk diakses oleh pasien
