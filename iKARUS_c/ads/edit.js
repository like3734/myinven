const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');

// ads edit view
router.get('/:num', (req, res) => {
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
    let query = 'select ads_title, ads_image, ads_link, ads_start, ads_end from ads where ads_id = ? ';
    connection.query(query, req.params.num, (err, data) => {
      if(err) res.status(400).send({ result: [], message: 'fail' });
      else{
        let new_data = {
          title: data[0].ads_title,
          image: data[0].ads_image,
          link: data[0].ads_link,
          start: data[0].ads_start,
          end: data[0].ads_end
        };
        res.status(201).send({ result: new_data, message: 'ok' });
      }
      connection.release();
    })
  })
})

// ads edit request
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
    let new_ads = {
      ads_title: req.body.title,
      ads_image: req.body.image,
      ads_link: req.body.link,
      ads_start: req.body.start,
      ads_end: req.body.end
    };
    let query = 'update ads set ? where ads_id = ? ';
    connection.query(query, [new_ads, req.body.id], (err, data) => {
      if(err) res.status(400).send({ message: 'fail' });
      else res.status(201).send({ message: 'ok' });
      connection.release();
    })
  })
})

module.exports = router;
