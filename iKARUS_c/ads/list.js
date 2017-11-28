const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

// ads list view
router.get('/:num', function(req, res){
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    })
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err });
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      let num = req.params.num; // page 번호
      let query = 'select ads_id, ads_title, ads_impressions, ads_views, ads_end from ads order by ads_id desc ';
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, num, connection]);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err });
    connection.release();
  })
  .then(([data, num, connection]) => {
    var f_count = 10*(num-1); // count의 시작
    var l_count = 0; // count의 마지막
    var allcount = data.length;
    if( f_count+10 < data.length){ // l_count를 정하는 조건문
      l_count = f_count+10 ;
    }
    else{
      l_count = data.length;
    }
    let listSet = []; // 최종 list 담을 배열
    for(var i=f_count; i<l_count; i++){ // 최종 list 추출
      let list = {
        id: data[i].ads_id,
        title: data[i].ads_title,
        impressions: data[i].ads_impressions,
        views: data[i].ads_views,
        end: moment(data[i].ads_end).format('YYYY.MM.DD'),
        sort: data[i].ads_sort
      };
      listSet.push(list);
    }

    res.status(200).send({ result: listSet, allcount: allcount, message: 'ok' });
    connection.release();
  })
})

// ads asc/desc
router.get('/title/:num/:count', function(req, res){
  if(req.params.count === "0" ){
    console.log('0일떄');
    return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if(err) reject(err);
        else fulfill(connection);
      })
    })
    .catch(err => {
      res.status(500).send({ message: 'getConnection err : ' + err });
    })
    .then((connection) => {
      return new Promise((fulfill, reject) => {
        let num = req.params.num;
        let query = 'select ads_id, ads_title, ads_impressions, ads_views, ads_end from ads order by ads_title desc ';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([data, num, connection]);
        });
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err });
      connection.release();
    })
    .then(([data, num, connection]) => {
      var f_count = 10*(num-1);
      var l_count = 0;
      var allcount = data.length;
      if( f_count+10 < data.length){
        l_count = f_count+10 ;
      }
      else{
        l_count = data.length;
      }
      let listSet = [];
      for(var i=f_count; i<l_count; i++){
        let list = {
          id: data[i].ads_id,
          title: data[i].ads_title,
          impressions: data[i].ads_impressions,
          views: data[i].ads_views,
          end: moment(data[i].ads_end).format('YYYY.MM.DD')
        };
        listSet.push(list);
      }
      res.status(200).send({ result: listSet, allcount: allcount, message: 'ok' });
      connection.release();
    })
  }
  else{
    return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if(err) reject(err);
        else fulfill(connection);
      })
    })
    .catch(err => {
      res.status(500).send({ message: 'getConnection err : ' + err });
    })
    .then((connection) => {
      return new Promise((fulfill, reject) => {
        let num = req.params.num;
        let query = 'select ads_id, ads_title, ads_impressions, ads_views, ads_end from ads order by ads_title asc ';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([data, num, connection]);
        });
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err });
      connection.release();
    })
    .then(([data, num, connection]) => {
      var f_count = 10*(num-1);
      var l_count = 0;
      var allcount = data.length;
      if( f_count+10 < data.length){
        l_count = f_count+10 ;
      }
      else{
        l_count = data.length;
      }
      let listSet = [];
      for(var i=f_count; i<l_count; i++){
        let list = {
          id: data[i].ads_id,
          title: data[i].ads_title,
          impressions: data[i].ads_impressions,
          views: data[i].ads_views,
          end: moment(data[i].ads_end).format('YYYY.MM.DD')
        };
        listSet.push(list);
      }
      res.status(200).send({ result: listSet, allcount: allcount, message: 'ok' });
      connection.release();
    })
  }
})

module.exports = router;
