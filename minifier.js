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
  ].map(i => ['./public/', i, '.js'].join(''))
).then(result => fs.writeFile(
  './production/client.js', result,
  err => !err && minify('./production/client.js')
    .then(min => fs.writeFile(
      './production/client.min.js',
      min, err => !err && [
        console.log('berhasil'),
        fs.unlink('./production/client.js', err => err)
      ]
    ))
))
