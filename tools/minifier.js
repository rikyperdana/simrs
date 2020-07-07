var minify = require('minify'),
fs = require('fs')
minify('./deploy/development/client.js').then(
  min => fs.writeFile(
    './deploy/production/client.min.js',
    min, console.log
  )
)
