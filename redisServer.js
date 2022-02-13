var dotenv = require('dotenv').config(),
express = require('express'),
redis = require('redis').createClient(),
sift = require('sift'),
{parse, stringify} = JSON,
io = require('socket.io'),
bcrypt = require('bcrypt'),
withThis = (obj, cb) => cb(obj),
ors = array => array.find(Boolean),
ands = array => array.reduce((res, inc) => res && inc, true)

app = express()
.use(express.static(
  process.env.production ?
  'production' : 'development'
)).listen(process.env.PORT || 3000)

io(app).on('connection', socket => [
  socket.on('datachange', (name, doc) =>
    socket.broadcast.emit('datachange', name, doc)
  ),
  socket.on('bcrypt', (text, cb) =>
    bcrypt.hash(text, 10, (err, res) => res && cb(res))
  ),
  socket.on('login', (creds, cb) => redis.lrange(
    'users', 0, -1, (err, data) => withThis(
      parse(data.find(
        i => withThis(parse(i), doc => ands([
          doc.username === creds.username,
          doc.keaktifan === 1
        ]))
      )),
      foundUser => bcrypt.compare(
        creds.password, foundUser.password,
        (err, result) => cb({res: result && foundUser})
      )
    )
  )),
  socket.on('dbCall', (obj, cb) => ({
    find: () => redis.lrange(
      obj.collection, 0, -1, (err, data) => cb(
        data.map(parse).filter(sift(obj.projection))
      )
    ),
    findOne: () => redis.lrange(
      obj.collection, 0, -1,
      (err, data) => cb(parse(data.find(
        i => parse(i)._id === obj._id
      )))
    ),
    insertOne: () => redis.rpush(
      obj.collection, stringify(obj.document),
      (err, data) => cb(data)
    ),
    insertMany: () => redis.rpush(
      obj.collection, ...obj.documents.map(stringify),
      (err, data) => data && cb(data)
    ),
    updateOne: () => redis.lrange(
      obj.collection, 0, -1,
      (err, data) => redis.lrem(
        obj.collection, 0, data.find(
          i => parse(i)._id === obj._id
        ),
        (err, done) => done && redis.rpush(
          obj.collection, stringify(obj.document),
          (err, data) => data && cb(data)
        )
      )
    ),
    updateMany: () => '', // TODO
    deleteOne: () => redis.lrem(
      obj.collection, 0, data.find(
        i => parse(i)._id === obj._id
      )
    ),
    getDifference: () => withThis(
      {
        ids: obj.clientColl.map(i => i._id),
        latest: obj.clientColl.reduce(
          (acc, inc) => inc.updated > acc ?
          inc.updated : acc, 0
        )
      },
      ({ids, latest}) => redis.lrange(
        obj.collection, 0, -1,
        (err, data) => cb(data.filter(i => ors([
          !ids.includes(parse(i)._id),
          parse(i).updated > latest
        ])).map(parse))
      )
    )
  })[obj.method]())
])

redis.lrange( // buat user admin pertama jika masih kosong
  'users', 0, -1, (err, data) => !data.length && redis.rpush(
    'users', stringify({
      _id: '050zjiki5pqoi0f2ua0xdm',
      username: 'admin', nama: 'admin',
      bidang: 5, peranan: 4, keaktifan: 1,
      password: '$2b$10$xZ22.NIdyoSP65nPTRUf2uN9.Dd4gkCbChwD5fOCjTm4kSPHylS4a',
      updated: 1590416308426 // password: admin
    })
  )
)

/*redis.lrange(
  'users', 0, -1,
  (err, data) => console.log(parse(
    data.find(i => parse(i)._id === '0a8sfha08se7fhaas08df')
  ))
)*/
