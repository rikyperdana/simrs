# SIMRS.dev (SIMRS Open Source untuk seluruh Faskes)

Bismillahirrahmanirrahim,
## Pengenalan
SIMRST adalah singkatan dari Sistem Informasi Rumah Sakit Terintegrasi, yang mendandakan bahwa sistem ini mencakup fungsi umum yang terdapat pada rumah sakit seperti Rawat Jalan, IGD, Rawat Inap, Apotik, Farmasi, Amprahan, dan Manajemen. Sistem ini menggunakan 1 database yang saling menghubungkan fungsi tersebut dengan otomatisasi sehingga memungkinkan rumah sakit untuk menjalankan sistem ini secar paperless maupun hybrid dengan dokumen fisiknya.

Sistem ini dibangun dengan menggunakan spesifikasi sebagai berikut:

|Teknologi|Keterangan|
|--|--|
|Bahasa|Javascript ES6|
|Server|Glitch|
|Paradigma|Functional|
|Backend|Express 4.16.4|
|Database|MongoDB 3.3.3|
|Frontend|Mithril JS 2.0.4|
|CSS|Bulma 0.7.5|

## Persiapan Pra-install
1. Paham tentang server publik [Glitch](https://glitch.com/)
2. Paham tentang [MongoDB](https://docs.mongodb.com/) dan [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. Paham tentang paradigma Functional Javascript, [MithrilJS](https://mithril.js.org/), [Lodash](https://lodash.com/docs/4.17.15), [Bulma](https://bulma.io/), dan [DexieJS](https://dexie.org/)
4. Paham tentang ragam prosedur operasional Rumah Sakit Umum

## Cara Install
### Bagian App
1. Clone project ini dari halaman glitch, rename nama project bila diperlukan

### Bagian DB
1. Login MongoDB Atlas, create Free cluster, klik create cluster
2. Pada halaman MongoDB Atlas, bagian Cluster, klik Connect
3. Klik Connect your Application
4. Pilih MongoDB version 2.2.12 or later
5. Klik Copy pada Connection String Only
6. Pada halaman MongoDB Atlas Cluster, create database "simrs" (atau nama lainnya).
7. Masih pada halaman Cluster, tambahkan dibawah db tersebut 5 collection
    `goods, patients, references, users, queue`
8. Pada Glitch code editor, Buat file pada project bernama `.env`. Ketikkan
```
MONGO="isikan dengan connection string, dan ganti <username> dan <password>"
dbname="nama databasenya"
```
Bila tidak ingin menggunakan Atlas, silahkan ganti nilai variabel `MONGO=""`
dengan alamat server database local Anda

### Bagian Manajemen
1. Pada file management.js line 4, ganti state.login.bidang !== 5 dengan false untuk membuka akses sementara
2. Pada halaman aplikasi, buka menu manajemen pengguna, dan mulai tambahkan beberapa user lainnya seperti yg ditunjukkan pada video tutorial khusus manajemen user (link di bawah)
3. Batasi kembali akses menu manajemen dengan mengganti false pada line 4 dengan state.login.bidang !== 5
4. Unduh dan ganti isi [Daftar tarif tindakan](https://docs.google.com/spreadsheets/d/1jtkgvq5SgWsljqtk0ZxkPW4fV-eZlAy5EjkzU41flSQ/edit?usp=sharing), simpan sebagai .csv dan unggah melalui tombol Import
5. Selamat mengikuti video tutorial pada playlist youtube berikut ini [Playlist Tutorial Pemakaian SIMRST Open Source](https://www.youtube.com/playlist?list=PL4oE8OvUySlyfGzQTu8kN9sPWWfcn_wSZ)

## Deskripsi Menu & Sub-menu

### Manajemen
#### Pengguna
Adalah menu yang dapat digunakan oleh admin untuk mendaftarkan users yang akan nantinya akan menggunakan sistem. Klik tambah akun dan isikan informasi seperti nama lengkap, alamat gmail, dan peranannya. Berikutnya sistem akan mengenali user berdasarkan alamat gmail yang digunakan untuk login dan memberikan hak akses sesuai dengan peranan yang ditetapkan oleh admin.
#### Referensi
Adalah menu yang dapat digunakan oleh admin untuk mendaftarkan tarif tindakan, laboratorium, dan radiologi ke dalam sistem dengan menggunakan file .csv seperti pada file [contoh](https://drive.google.com/open?id=1jtkgvq5SgWsljqtk0ZxkPW4fV-eZlAy5EjkzU41flSQ). Silahkan hapus seluruh baris kecuali header pertama dan ganti isinya sesuai dengan tarif pada faskes Anda. Setelah import berhasil, silahkan refresh browser.
### Pendaftaran
### Emergency Unit
### Rawat Jalan
### Rawat Inap
Pemetaan ketersediaan bed rawat inap dapat diubah pada file `public/inpatient.js` dalam variabel `beds`. Dengan struktur `{kelas: {tarif, kamar: {nama_kamar}}}`
### Kasir
### Gudang
### Apotik
### Manajemen

## Struktur Kode
## Dependensi
## Permasalahan
## Pengembangan
