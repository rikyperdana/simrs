var concat = require('concat')
concat(
  [
    'autoForm', 'functions', 'selects', 'schemas',
    'pdf', 'registration', 'patient', 'icd',
    'outpatient', 'inpatient', 'igd', 'storage',
    'transfer', 'pharmacy', 'cashier', 'management',
    'queue', 'surgery', 'profile', 'app'
  ].map(i => ['./public/', i, '.js'].join('')),
  './deploy/client.js'
)
