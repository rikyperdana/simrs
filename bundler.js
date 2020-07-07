var concat = require('concat'),
minify = require('minify'),
fs = require('fs')

concat(
  [
    'autoForm', 'functions', 'selects', 'schemas',
    'pdf', 'registration', 'patient', 'icd',
    'outpatient', 'inpatient', 'igd', 'storage',
    'transfer', 'pharmacy', 'cashier', 'management',
    'queue', 'surgery', 'profile', 'app'
  ].map(i => ['./development/', i, '.js'].join(''))
).then(result => fs.writeFile(
  './production/bundled.js', result,
  err => !err && minify('./production/bundled.js')
    .then(min => fs.writeFile(
      './production/bundled.min.js',
      min, err => !err && [
        console.log('berhasil'),
        fs.unlink('./production/bundled.js', err => err)
      ]
    ))
))
