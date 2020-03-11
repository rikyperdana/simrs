var express = require("express"),
bodyParser = require('body-parser'),
mongoDB = require("mongodb"),
_ = require('lodash'),
io = require('socket.io'),
withThis = (obj, cb) => cb(obj),
bpjs = require('./bpjs'),
app = express()
.use(express.static("public"))
.use(bodyParser.urlencoded({extended: false}))
.use(bodyParser.json())
.post('/bpjs', bpjs.bpjs)
.listen(3000),

dbCall = action => mongoDB.MongoClient.connect(
  process.env.atlas,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) => [action(client.db("medicare")), /*client.close()*/]
)

var io = require('socket.io')(app)
io.on('connection', socket => [
  socket.on('isMember', (gmail, cb) =>
    dbCall(db =>
      db.collection('users').findOne(
        {gmail}, (err, res) => cb(!!res)
      )
    )
  ),
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
      insertMany: () =>
        obj.documents.map(doc =>
          coll.insertOne(doc)
        )
      ,
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
        obj.clientColl,
        clientColl => coll.find({$or: [
          {_id: {$not: {$in: clientColl.map(i => i._id)}}},
          {updated: {$gt: clientColl.reduce((res, inc) =>
            inc.updated > res ? inc.updated : res
          , 0)}}
        ]}).toArray((err, res) => cb(res))
      )
    }[obj.method]())
  )))
])