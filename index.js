var express = require("express"),
bodyParser = require('body-parser'),
mongoDB = require("mongodb"),
_ = require('lodash'),
withThis = (obj, cb) => cb(obj),
app = express()
.use(express.static("public"))
.use(bodyParser.urlencoded({ extended: false }))
.use(bodyParser.json())
.put("/isMember", (req, cb) =>
  dbCall(db =>
    db.collection('users').findOne(
      {gmail: req.body.gmail},
      (err, res) => cb.send(!!res)
    )
  )
)
.put("/dbCall", (req, cb) =>
  dbCall(db => withThis(
    db.collection(req.body.collection),
    coll => ({
      find: () =>
        coll.find(req.body.projection, req.body.options)
        .toArray((err, res) => cb.send(res))
      ,
      findOne: () => coll.findOne(
        {_id: req.body._id},
        (err, res) => cb.send(res)
      ),
      insertOne: () => coll.insertOne(
        req.body.document,
        (err, res) => cb.send(res)
      ),
      insertMany: () =>
        req.body.documents.map(doc =>
          coll.insertOne(doc)
        )
      ,
      updateOne: () => coll.updateOne(
        {_id: req.body._id},
        {$set: req.body.document},
        (err, res) => cb.send(res)
      ),
      deleteOne: () => coll.deleteOne(
        {_id: req.body._id},
        (err, res) => cb.send(res)
      ),
      getDifference: () => withThis(
        req.body.clientColl,
        clientColl => coll.find({$or: [
          {_id: {$not: {$in: clientColl.map(i => i._id)}}},
          {updated: {$gt: clientColl.reduce((res, inc) =>
            inc.updated > res ? inc.updated : res
          , 0)}}
        ]}).toArray((err, res) => cb.send(res))
      )
    }[req.body.method]())
  ))
).listen(3000),

dbCall = action => mongoDB.MongoClient.connect(
  process.env.atlas,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) => [action(client.db("medicare")), /*client.close()*/]
)


// Client call samples
  // m.request({url: '/dbCall', params:
  //   {method: 'find', collection: 'people'}
  // }).then(console.log)
  // m.request({url: '/dbCall', params: {
  //   method: 'insertOne', collection: 'people',
  //   document: {name: 'Lia Anggraini'}
  // }}).then(console.log)
  // m.request({url: '/dbCall', params: {
  //   method: 'updateOne', collection: 'people',
  //   _id: '5ddd2d481c9d4400003aeda8',
  //   options: {$set: {name: 'Riky Perdana, SE., MM'}}
  // }}).then(console.log)
  // m.request({url: '/dbCall', params: {
  //   method: 'deleteOne', collection: 'people',
  //   _id: '5ddd2d481c9d4400003aeda8'
  // }}).then(console.log)