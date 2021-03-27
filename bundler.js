var concat = require('concat'),
minify = require('minify'),
fs = require('fs')

concat(
  [ // dafatarkan seluruh file client yg akan dipublish
    'autoForm', 'custom', 'functions', 'doms', 'selects',
    'schemas', 'pdf', 'registration', 'patient', 'icd',
    'outpatient', 'inpatient', 'igd', 'storage',
    'transfer', 'pharmacy', 'cashier', 'management',
    'queue', 'surgery', 'profile', 'radiology',
    'laboratory', 'telemed', 'gizi', 'reports', 'app'
  ].map(i => ['./development/', i, '.js'].join(''))
).then(result => fs.writeFile(
  // keluarkan hasil bundlenya
  './production/bundled.js', result,
  err => !err && minify('./production/bundled.js')
    .then(min => fs.writeFile(
      // minifikasi file bundle
      './production/bundled.min.js',
      min, err => !err && fs.unlink(
        // hapus file bundle sebelumnya
        './production/bundled.js',
        err => !err && console.log('berhasil')
      )
    ))
))
