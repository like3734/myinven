// const express = require('express');
// const router = express.Router();
// const aws = require('aws-sdk');
// aws.config.loadFromPath('./config/aws_config.json');
// const pool = require('../../config/db_pool');
// const crypto = require('crypto');
// const hash = crypto.createHash('sha512');
// const jwt = require('jsonwebtoken');
// const saltRounds = 102389;
//
// // sign up ( only admin )
// router.post('/', function(req, res){
//   return new Promise((fulfill, reject) => {
//     pool.getConnection((err, connection) => {
//       if(err) reject(err);
//       else fulfill(connection);
//     })
//   })
//   .catch(err => {
//     res.status(500).send({ message: 'getConnection err : ' + err });
//   })
//   .then((connection) => {
//     let id = req.body.id;
//     let key = crypto.pbkdf2Sync(req.body.pwd, 'salt', saltRounds, 512, 'sha512');
//     let pwd = key.toString('hex');
//     let query = 'insert into admin values(?,?)';
//     connection.query(query, [id,pwd], (err, data) => {
//       if(err) res.status(400).send({ message : 'fail' });
//       else res.status(201).send({ message : 'ok' });
//       connection.release();
//     });
//   })
// })
//
//
// module.exports = router;
