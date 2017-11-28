const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const saltRounds = 102389;

//sign in cors()
router.post('/', function(req, res){
    return new Promise((fulfill, reject) => {
        pool.getConnection((err, connection) => {
            if(err) reject(err);
            else fulfill(connection);
        });
    })
    .catch(err => {
        res.status(500).send({ message: "get Connection err : " + err});
    })
    .then(connection => {
      return new Promise((fulfill, reject) => {
        let id = req.body.id;
        let key = crypto.pbkdf2Sync(req.body.pwd, 'salt', saltRounds, 512, 'sha512'); // password hashing
        let pwd = key.toString('hex');
        let query = 'select admin_id from admin where admin_id = ? and admin_pwd = ? ';
        connection.query(query, [id,pwd], (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([data, connection]);
        });
      })
    })
    .catch(([err, connection])=>{
      res.status(403).send({ message: "user authorization err" + err});
      connection.release();
    })
    .then(([data, connection])=>{
      if(data.length === 0 ){
        res.status(403).send({ message : 'fail' });
      }
      else {
        const secret = req.app.get('jwt-secret');
        let option = {
            algorithm: 'HS256',
            expiresIn: 3600 * 24 * 10 // 토큰의 유효기간이 10일
        };
        let payload = {
            admin_id : data[0].admin_id
        };
        let token = jwt.sign(payload, secret, option); // admin JWT token
        res.status(200).send({
            message: "ok",
            token: token
        });
        connection.release();
      }
    })
});


module.exports = router;
