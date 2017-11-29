const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');


router.get('/politics', function(req, res){
    return new Promise((fulfill, reject) => {
        pool.getConnection((err, connection) => {
            if(err) reject(err);
            else fulfill(connection);
        });
    })
    .catch(err => {
        res.status(500).send({ result: [], message: "get Connection err : " + err});
    })
    .then(connection => {
        return new Promise((fulfill, reject) => {
          let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 1 order by news_rank asc';
          connection.query(query, (err, data) => {
              if(err) reject([err, connection]);
              else fulfill([data, connection]);
          });
        });
    })
    .catch(([err, connection]) => {
      res.status(500).send({ result: [], message: "select query err : " + err});
      connection.release();
    })
    .then(([data, connection]) => {
      var today = new Date();
      today = moment(today).format('YYYYMMDD');
      var oneago = moment(today).subtract(1, 'days').format('YYYYMMDD');
      var twoago = moment(today).subtract(2, 'days').format('YYYYMMDD');
      console.log(oneago);
      var oneday = [];
      var twoday = [];
      //moment().subtract(7, 'days');
      for(let i=0; i<data.length; i++){
        if(data[i].news_date == oneago){
          oneday.push(data[i]);
        }
        else if(data[i].news_date == twoago){
          twoday.push(data[i]);
        }
      }
      res.status(200).send({ result: [oneday, twoday] ,message: 'success'});
      connection.release();
    })
});

router.get('/economies', function(req, res){
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
          if(err) reject(err);
          else fulfill(connection);
      });
  })
  .catch(err => {
      res.status(500).send({ result: [], message: "get Connection err : " + err});
  })
  .then(connection => {
      return new Promise((fulfill, reject) => {
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 2 order by news_rank asc';
        connection.query(query, (err, data) => {
            if(err) reject([err, connection]);
            else fulfill([data, connection]);
        });
      });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "select query err : " + err});
    connection.release();
  })
  .then(([data, connection]) => {
    var today = new Date();
    today = moment(today).format('YYYYMMDD');
    var oneago = moment(today).subtract(1, 'days').format('YYYYMMDD');
    var twoago = moment(today).subtract(2, 'days').format('YYYYMMDD');
    console.log(oneago);
    var oneday = [];
    var twoday = [];
    //moment().subtract(7, 'days');
    for(let i=0; i<data.length; i++){
      if(data[i].news_date == oneago){
        oneday.push(data[i]);
      }
      else if(data[i].news_date == twoago){
        twoday.push(data[i]);
      }
    }
    res.status(200).send({ result: [oneday, twoday] ,message: 'success'});
    connection.release();
  })
});

router.get('/societies', function(req, res){
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
          if(err) reject(err);
          else fulfill(connection);
      });
  })
  .catch(err => {
      res.status(500).send({ result: [], message: "get Connection err : " + err});
  })
  .then(connection => {
      return new Promise((fulfill, reject) => {
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 3 order by news_rank asc';
        connection.query(query, (err, data) => {
            if(err) reject([err, connection]);
            else fulfill([data, connection]);
        });
      });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "select query err : " + err});
    connection.release();
  })
  .then(([data, connection]) => {
    var today = new Date();
    today = moment(today).format('YYYYMMDD');
    var oneago = moment(today).subtract(1, 'days').format('YYYYMMDD');
    var twoago = moment(today).subtract(2, 'days').format('YYYYMMDD');
    console.log(oneago);
    var oneday = [];
    var twoday = [];
    //moment().subtract(7, 'days');
    for(let i=0; i<data.length; i++){
      if(data[i].news_date == oneago){
        oneday.push(data[i]);
      }
      else if(data[i].news_date == twoago){
        twoday.push(data[i]);
      }
    }
    res.status(200).send({ result: [oneday, twoday] ,message: 'success'});
    connection.release();
  })
  });

router.get('/sciences', function(req, res){
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
          if(err) reject(err);
          else fulfill(connection);
      });
  })
  .catch(err => {
      res.status(500).send({ result: [], message: "get Connection err : " + err});
  })
  .then(connection => {
      return new Promise((fulfill, reject) => {
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 4 order by news_rank asc';
        connection.query(query, (err, data) => {
            if(err) reject([err, connection]);
            else fulfill([data, connection]);
        });
      });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "select query err : " + err});
    connection.release();
  })
  .then(([data, connection]) => {
    var today = new Date();
    today = moment(today).format('YYYYMMDD');
    var oneago = moment(today).subtract(1, 'days').format('YYYYMMDD');
    var twoago = moment(today).subtract(2, 'days').format('YYYYMMDD');
    console.log(oneago);
    var oneday = [];
    var twoday = [];
    //moment().subtract(7, 'days');
    for(let i=0; i<data.length; i++){
      if(data[i].news_date == oneago){
        oneday.push(data[i]);
      }
      else if(data[i].news_date == twoago){
        twoday.push(data[i]);
      }
    }
    res.status(200).send({ result: [oneday, twoday] ,message: 'success'});
    connection.release();
  })
});

module.exports = router;
