const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');

// category edit
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
    res.status(400).send({ message: 'begin Transaction err : ' + err });
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
      let query = 'update category set name = ? where parents = ? and name = ? '; // 해당 category의 name 변경
      connection.query(query, [req.body.new_category, req.body.parents, req.body.category], (err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'update query err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    let query = 'update category set parents = ? where parents = ?'; // 해당 category를 부모로 갖는 category의 parents 변경
    connection.query(query, [req.body.new_category, req.body.category], (err, data) => {
      if(err){
        res.status(400).send({ message: 'fail : ' + err });
        connection.rollback();
        connection.release();
      }
      else{
        res.status(201).send({ message: 'ok' });
        connection.commit();
        connection.release();
      }
    })
  })
})

// // category edit
// router.post('/', (req, res) => {
//   return new Promise((fulfill,reject) => {
//     pool.getConnection((err, connection) => {
//       if(err) reject(err);
//       else fulfill(connection);
//     });
//   })
//   .catch(err => {
//     res.status(500).send({ message: 'getConnection err : ' + err });
//   })
//   .then(connection => {
//     return new Promise((fulfill, reject) => {
//       let token = req.headers.token;
//       jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
//         if(err) reject([err, connection]);
//         else fulfill(connection);
//       });
//     })
//   })
//   .catch(([err, connection]) => {
//     res.status(403).send({ message: ' jwt err : ' + err});
//     connection.release();
//   })
//   .then(connection => {
//     let category = {
//       parents: req.body.parents,
//       name: req.body.category
//     };
//     let new_category = {
//       parents: req.body.parents,
//       name: req.body.new_category
//     };
//     let query = 'update category set name = ? where parents = ? and name = ? ';
//     connection.query(query, [req.body.new_category, req.body.parents, req.body.category], (err, data) => {
//       if(err) res.status(400).send({ message: 'fail : ' + err });
//       else res.status(201).send({ message: 'ok' });
//       connection.release();
//     })
//   })
// })

module.exports = router;
