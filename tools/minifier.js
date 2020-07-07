var minify = require('minify'),
fs = require('fs')
minify('./client/client.js')
.then(min => fs.writeFile('./client/client.min.js', min, console.log))
