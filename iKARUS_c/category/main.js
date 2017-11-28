const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

// main view
router.get('/', (req, res) => {
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
    let query = 'select * from category ';
    connection.query(query, (err, data) => {
      if(err) res.status(400).send({ result: [], message: 'fail' });
      else{
        let resultSet = [];
        for(let i = 0; i<data.length; i++){ // null 제외
          if(data[i].name !== ""){
            resultSet.push(data[i]);
          }
        }
        res.status(200).send({ result: resultSet, message: 'ok' });
      }
      connection.release();
    })
  })
})



module.exports = router;
