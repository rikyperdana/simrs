var dotenv = require('dotenv').config(),
express = require('express'),
mongoDB = require('mongodb'),
io = require('socket.io'),
bcrypt = require('bcrypt'),
withThis = (obj, cb) => cb(obj),

app = express()
.use(express.static(
  process.env.production ?
  'production' : 'development'
)).listen(process.env.PORT || 3000)

mongoDB.MongoClient.connect(
  process.env.MONGO,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) => err ? console.log(err)
  : io(app).on('connection', socket => [
    socket.on('datachange', (name, doc) =>
      socket.broadcast.emit('datachange', name, doc)
    ),
    socket.on('bcrypt', (text, cb) =>
      bcrypt.hash(text, 10, (err, res) => res && cb(res))
    ),
    socket.on('login', (creds, cb) => withThis(
      client.db(process.env.dbname),
      db => db.collection('users').findOne(
        { // hanya user aktif yang boleh login
          username: creds.username,
          keaktifan: 1
        },
        (err, res) => res && bcrypt.compare(
          // tes kebenaran password
          creds.password, res.password,
          // kembalikan doc user yg ditemukan, jgn diubah
          (err, result) => cb({res: result && res})
        )
      )
    )),
    socket.on('dbCall', (obj, cb) => withThis(
      client.db(process.env.dbname).collection(obj.collection),
      coll => ({
        find: () =>
          coll.find(obj.projection, obj.options)
          .toArray((err, res) => res && cb(res))
        ,
        findOne: () => coll.findOne(
          {_id: obj._id}, (err, res) => res && cb(res)
        ),
        insertOne: () => coll.insertOne(
          obj.document, (err, res) => res && cb(res)
        ),
        insertMany: () => coll.insertMany(
          obj.documents, (err, res) => res && cb(res)
        ),
        updateOne: () => coll.updateOne(
          {_id: obj._id}, {$set: obj.document}, {upsert: true},
          (err, res) => res && cb(res)
        ),
        updateMany: () => (obj.documents || []).map(
          doc => coll.updateOne(
            {_id: doc._id}, {$set: doc}, {upsert: true},
            (err, res) => res && cb(res)
          )
        ),
        deleteOne: () => coll.deleteOne(
          {_id: obj._id}, (err, res) => res && cb(res)
        ),
        getDifference: () => withThis(
          {
            ids: obj.clientColl.map(i => i._id),
            latest: obj.clientColl.reduce(
              (acc, inc) => inc.updated > acc ?
              inc.updated : acc, 0
            )
          },
          ({ids, latest}) => coll.find({$or: [
            // cari yg belum tersedia pada client
            {_id: {$nin: ids}},
            // cari yg lebih baru dari milik client
            {updated: {$gt: latest}}
          ]}).toArray((err, res) => res && cb(res))
        )
      }[obj.method]())
    )),
    withThis( // buat user admin pertama jika masih kosong
      client.db(process.env.dbname).collection('users'),
      users => users.findOne({}, (err, res) =>
        !res && users.insertOne({
          _id: '050zjiki5pqoi0f2ua0xdm',
          username: 'admin', nama: 'admin',
          bidang: 5, peranan: 4, keaktifan: 1,
          password: '$2b$10$xZ22.NIdyoSP65nPTRUf2uN9.Dd4gkCbChwD5fOCjTm4kSPHylS4a',
          updated: 1590416308426 // password: admin
        })
      )
    )
  ])
)
