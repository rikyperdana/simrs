# Medicare (SIMRS Open Source untuk seluruh Faskes)

Bismillahirrahmanirrahim,
## Pengenalan
SIMRST adalah singkatan dari Sistem Informasi Rumah Sakit Terintegrasi, yang mendandakan bahwa sistem ini mencakup fungsi umum yang terdapat pada rumah sakit seperti Rawat Jalan, IGD, Rawat Inap, Apotik, Farmasi, Amprahan, dan Manajemen. Sistem ini menggunakan 1 database yang saling menghubungkan fungsi tersebut dengan otomatisasi sehingga memungkinkan rumah sakit untuk menjalankan sistem ini secar paperless maupun hybrid dengan dokumen fisiknya.

Sistem ini dibangun dengan menggunakan spesifikasi sebagai berikut:

|Teknologi|Keterangan|
|--|--|
|Bahasa|Javascript 1.6|
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
2. Login MongoDB Atlas, create Free cluster, klik create cluster
3. Pada halaman MongoDB Atlas, bagian Cluster, klik Connect
4. Klik Connect your Application
5. Pilih MongoDB version 2.2.12 or later
6. Klik Copy pada Connection String Only
7. Paste pada variabel atlas = "" dalam file .env
8. Ganti <password> dengan password akun sendiri
9. Pada halaman MongoDB Atlas Cluster, create database "simrs" (atau nama lainnya).
   Sesuaikan nama db tersebut ke client.db(namaDBnya) pada file index.js
10. Masih pada halaman Cluster, tambahkan dibawah db tersebut 4 collection
    goods, patients, references, users

### Bagian Google Auth
11. Siapkan [google authentication api](https://developers.google.com/identity/sign-in/web/sign-in)
12. Configure a project > Create new (nama bebas) > Pilih web browser > isikan https://namaAppnya.glitch.me > Create
13. Salin client ID ke client_id: '' pada line 84 dalam file app.js.
    Jika lupa bisa akses lagi di [Google Api Credentials](https://console.developers.google.com/apis/credentials)
14. Pada file management.js line 4, ganti state.login.bidang !== 5 dengan false untuk membuka akses sementara

### Bagian Manajemen
15. Pada halaman aplikasi, buka menu manajemen pengguna, dan mulai tambahkan beberapa user lainnya
    seperti yg ditunjukkan pada video tutorial khusus manajemen user (link di bawah)
16. Batasi kembali akses menu manajemen dengan mengganti false pada line 4 dengan state.login.bidang !== 5
17. Unduh dan ganti isi [Daftar tarif tindakan](https://docs.google.com/spreadsheets/d/1jtkgvq5SgWsljqtk0ZxkPW4fV-eZlAy5EjkzU41flSQ/edit?usp=sharing), simpan sebagai .csv dan unggah melalui tombol Import
18. Selamat mengikuti video tutorial pada playlist youtube berikut ini
    [Playlist Tutorial Pemakaian SIMRST Open Source](https://www.youtube.com/playlist?list=PL4oE8OvUySlyfGzQTu8kN9sPWWfcn_wSZ)

Bila tidak ingin menggunakan Atlas, silahkan ganti nilai variabel atlas = "" dengan alamat server database local Anda

## Deskripsi Menu & Sub-menu

### Manajemen
#### Pengguna
Adalah menu yang dapat digunakan oleh admin untuk mendaftarkan users yang akan nantinya akan menggunakan sistem. Klik tambah akun dan isikan informasi seperti nama lengkap, alamat gmail, dan peranannya. Berikutnya sistem akan mengenali user berdasarkan alamat gmail yang digunakan untuk login dan memberikan hak akses sesuai dengan peranan yang ditetapkan oleh admin.
#### Referensi
Adalah menu yang dapat digunakan oleh admin untuk mendaftarkan tarif tindakan, laboratorium, dan radiologi ke dalam sistem dengan menggunakan file .csv seperti pada file [contoh](https://drive.google.com/open?id=1jtkgvq5SgWsljqtk0ZxkPW4fV-eZlAy5EjkzU41flSQ). Silahkan hapus seluruh baris kecuali header pertama dan ganti isinya sesuai dengan tarif pada faskes Anda. Setelah import berhasil, silahkan refresh browser.

### Pendaftaran

## Struktur Kode
## Dependensi
## Permasalahan
## Pengembangan