
var
dotenv = require('dotenv').config(),
express = require('express'),
mongoDB = require('mongodb'),
io = require('socket.io'),
bcrypt = require('bcrypt'),
withThis = (obj, cb) => cb(obj),
app = express()
.use(express.static('public'))
.listen(process.env.PORT || 3000),

dbCall = action => mongoDB.MongoClient.connect(
  process.env.atlas || process.env.MONGO,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) => err ? console.log(err)
    : action(client.db(process.env.dbname))
)

var io = require('socket.io')(app)
io.on('connection', socket => [
  socket.on('datachange', (name, doc) =>
    socket.broadcast.emit('datachange', name, doc)
  ),
  socket.on('bcrypt', (type, text, cb) =>
    bcrypt.hash(text, 10, (err, res) => cb(res))
  ),
  socket.on('login', (creds, cb) => dbCall(db =>
    db.collection('users').findOne(
      {username: creds.username},
      (err, res) => bcrypt.compare(
        creds.password, res.password,
        (err, result) => cb({res: !!result})
      )
    )
  )), // alhamdulillah bisa pakai bcrypt
  socket.on('dbCall', (obj, cb) => dbCall(db => withThis(
    db.collection(obj.collection),
    coll => ({
      find: () =>
        coll.find(obj.projection, obj.options)
        .toArray((err, res) => cb(res))
      ,
      findOne: () => coll.findOne(
        {_id: obj._id},
        (err, res) => cb(res)
      ),
      insertOne: () => coll.insertOne(
        obj.document,
        (err, res) => cb(res)
      ),
      insertMany: () => coll.insertMany(
        obj.documents,
        (err, res) => cb(res)
      ),
      updateOne: () => coll.updateOne(
        {_id: obj._id},
        {$set: obj.document},
        (err, res) => cb(res)
      ),
      deleteOne: () => coll.deleteOne(
        {_id: obj._id},
        (err, res) => cb(res)
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
          {_id: {$not: {$in: ids}}},
          {updated: {$gt: latest}}
        ]}).toArray((err, res) => cb(res))
      )
    }[obj.method]())
  )))
])
