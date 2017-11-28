const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');



//writer register [image url]
router.post('/', (req, res) => {
  return new Promise((fulfill,reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err });
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      connection.beginTransaction(err => {
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => {
    res.status(500).send({ message : 'beginTransaction err : ' + err});
    connection.release();
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
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let dataSet = {
        writer_name: req.body.name,
        writer_image: req.body.image,
        writer_email: req.body.email,
        writer_belong: req.body.belong,
        writer_position: req.body.position
      };
      let query = 'insert into writer set ? ';
      connection.query(query, dataSet, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: ' insert writer err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select writer_id from writer order by writer_id desc ';
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: ' select query err' + err });
    connection.rollback();
    connection.release();
  })
  .then(([data, connection]) => {
      let new_writer = data[0].writer_id;
      let arySet = [];
      let profileSet = [];
      arySet = JSON.parse(req.body.profile);
      for(let i=0; i<arySet.length; i++){
        let profile = {
          profile_title: arySet[i].title,
          profile_fromtime: arySet[i].fromtime,
          profile_untiltime: arySet[i].untiltime,
          profile_exp: arySet[i].exp,
          profile_writer: new_writer
        };
        profileSet.push(profile);
      }
      let query = 'insert into profile set ? ';
      for(let j=0; j<profileSet.length; j++){
        if(j !== profileSet.length-1){
          connection.query(query, profileSet[j], (err, data) => {
              if(err){
                res.status(400).send({ message: 'fail' });
                connection.rollback();
                connection.release();
              }
          });
        }
        else{
          connection.query(query, profileSet[j], (err, data) => {
              if(err){
                res.status(400).send({ message: 'fail' });
                connection.rollback();
                connection.release();
              }
              else{
                res.status(201).send({ message: 'ok' });
                connection.commit();
                connection.release();
              }
          });
        }
      }
  })
})

module.exports = router;
