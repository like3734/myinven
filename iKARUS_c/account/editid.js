const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');

//edit id
router.post('/', function(req, res){
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message : 'get Connection err : ' + err}); })
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
      jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => { // token 유효성 검사
        if(err) reject([err, connection]);
        else{
          var id = decoded.admin_id;
          fulfill([id,connection]);
        }
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(403).send({ message: " jwt err : " + err });
    connection.rollback();
    connection.release();
  })
  .then(([id, connection]) => {
    return new Promise((fulfill, reject) => {
      let new_id = req.body.id;
      let query = 'update admin set admin_id = ? where admin_id = ? ';
      connection.query(query, [new_id,id], (err) => {
        if(err) reject([err, connection]);
        else fulfill([new_id, connection]);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message : 'edit id err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(([new_id, connection]) => {
    const secret = req.app.get('jwt-secret'); // 새로운 token 발급
    let option = {
        algorithm: 'HS256',
        expiresIn: 3600 * 24 * 10 // 토큰의 유효기간이 10일
    };
    let payload = {
        admin_id : new_id
    };
    let token = jwt.sign(payload, secret, option);

    res.status(201).send({
        message: "ok",
        token: token
    });
    connection.commit();
    connection.release();
  })
})

module.exports = router;
