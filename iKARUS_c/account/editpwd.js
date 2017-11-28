const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const saltRounds = 102389;

//edit pwd
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
      let token = req.headers.token;
      jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
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
    connection.release();
  })
  .then(([id, connection]) => {
    return new Promise((fulfill, reject) => {
      let new_pwd = req.body.pwd; // 새로운 password
      let copy_pwd = req.body.cpwd; // 새로운 password copy
      if(new_pwd !== copy_pwd){
        reject(connection);
      }
      else fulfill([new_pwd, id, connection]);
    })
  })
  .catch((connection) => {
    res.status(400).send({ message : "pwd Incorrect err" });
    connection.release();
  })
  .then(([new_pwd, id, connection]) => {
    let key = crypto.pbkdf2Sync(new_pwd, 'salt', saltRounds, 512, 'sha512'); // 새로운 password encrypt
    let pwd = key.toString('hex');
    let query = 'update admin set admin_pwd = ? where admin_id = ?';
    connection.query(query, [pwd, id], (err) => {
      if(err) res.status(400).send({ message : 'fail' });
      else res.status(201).send({ message : 'ok' });
    });
    connection.release();
  })
})

module.exports = router;
