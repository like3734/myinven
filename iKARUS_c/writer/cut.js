const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');

// delete writer
router.post('/', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    })
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err });
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let token = req.headers.token;
      jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(403).send({ message: ' jwt err : ' + err});
    connection.release();
  })
  .then(connection => {
    let idSet = JSON.parse(req.body.id);
    let query = 'delete from writer where writer_id = ? ';
    for(let i=0; i<idSet.length; i++){
      if( i !== idSet.length-1 ){
        connection.query(query, idSet[i], (err, data) => {
          if(err) res.status(400).send({ message: 'fail' });
        });
      }
      else{
        connection.query(query, idSet[i], (err, data) => {
          if(err) res.status(400).send({ message: 'fail' });
          else{
            res.status(201).send({ message: 'ok' });
            connection.release();
          }
        });
      }
    }
  })
})


module.exports = router;
