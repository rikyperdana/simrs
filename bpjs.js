var CryptoJS = require('crypto-js'),

encrypt = (data, secret) =>
  CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(data, secret)
  ),

timestamp = () =>
  Math.floor(Date.now()/1000).toString(),

signature = () => encrypt(
  [process.env.cons_id, '&', timestamp()].join(''),
  process.env.secret_key
),

creds = () => ({
  cons_id: process.env.cons_id,
  timestamp: timestamp(),
  signature: signature()
})