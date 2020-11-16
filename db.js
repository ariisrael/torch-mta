if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const  MongoClient = require('mongodb').MongoClient
const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hwrtj.mongodb.net/torchMTA?retryWrites=true&w=majority`


let state = { db: null }

exports.connect = function(done) {
  if (state.db) return done()
  const client = MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  client.connect(function(err, dbclient) {
    if(err) return done(err)
    state.db = dbclient.db('torchMTA')
    done()
  })
}

exports.get = function() {
  return state.db
}

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null;
      state.mode = null;
      done(err);
    })
  } 
}