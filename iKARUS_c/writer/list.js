const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

// writer list view
router.get('/:num', function(req, res){
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    })
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err });
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      let num = req.params.num;
      let query = 'select writer_id, writer_name, writer_email, writer_belong, writer_position from writer order by writer_id desc ';
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, num, connection]);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err });
    connection.release();
  })
  .then(([data, num, connection]) => {
    var f_count = 10*(num-1);
    var l_count = 0;
    var allcount = data.length;
    if( f_count+10 < data.length){
      l_count = f_count+10 ;
    }
    else{
      l_count = data.length;
    }
    let listSet = [];
    for(var i=f_count; i<l_count; i++){
      let list = {
        id: data[i].writer_id,
        name: data[i].writer_name,
        email: data[i].writer_email,
        belong: data[i].writer_belong,
        position: data[i].writer_position
      };
      listSet.push(list);
    }

    res.status(200).send({ result: listSet, allcount: allcount, message: 'ok' });
    connection.release();
  })
})

//오름차순
router.get('/name/:num/:count', function(req, res){
  if(req.params.count === '0'){
    return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if(err) reject(err);
        else fulfill(connection);
      })
    })
    .catch(err => {
      res.status(500).send({ message: 'getConnection err : ' + err });
    })
    .then((connection) => {
      return new Promise((fulfill, reject) => {
        let num = req.params.num;
        let query = 'select writer_id, writer_name, writer_email, writer_belong, writer_position from writer order by writer_name desc ';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([data, num, connection]);
        });
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err });
      connection.release();
    })
    .then(([data, num, connection]) => {
      var f_count = 10*(num-1);
      var l_count = 0;
      var allcount = data.length;
      if( f_count+10 < data.length){
        l_count = f_count+10 ;
      }
      else{
        l_count = data.length;
      }
      let listSet = [];
      for(var i=f_count; i<l_count; i++){
        let list = {
          id: data[i].writer_id,
          name: data[i].writer_name,
          email: data[i].writer_email,
          belong: data[i].writer_belong,
          position: data[i].writer_position
        };
        listSet.push(list);
      }
      res.status(200).send({ result: listSet, allcount: allcount, message: 'ok' });
      connection.release();
    })
  }
  else{
    return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if(err) reject(err);
        else fulfill(connection);
      })
    })
    .catch(err => {
      res.status(500).send({ message: 'getConnection err : ' + err });
    })
    .then((connection) => {
      return new Promise((fulfill, reject) => {
        let num = req.params.num;
        let query = 'select writer_id, writer_name, writer_email, writer_belong, writer_position from writer order by writer_name asc ';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([data, num, connection]);
        });
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err });
      connection.release();
    })
    .then(([data, num, connection]) => {
      var f_count = 10*(num-1);
      var l_count = 0;
      var allcount = data.length;
      if( f_count+10 < data.length){
        l_count = f_count+10 ;
      }
      else{
        l_count = data.length;
      }
      let listSet = [];
      for(var i=f_count; i<l_count; i++){
        let list = {
          id: data[i].writer_id,
          name: data[i].writer_name,
          email: data[i].writer_email,
          belong: data[i].writer_belong,
          position: data[i].writer_position
        };
        listSet.push(list);
      }
      res.status(200).send({ result: listSet, allcount: allcount, message: 'ok' });
      connection.release();
    })
  }
})

module.exports = router;
