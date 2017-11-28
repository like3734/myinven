const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

// data list view
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
      let num = req.params.num;
      // 자료 list
      let query = 'select  data_id, data_title, data_type, data_lmd, data_dept, data_topic, data_subtopic from data order by data_id desc ';
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
    return new Promise((fulfill, reject) => {
      let dataSet = [];
      let allcount = data.length;
      for(let i=0; i<data.length; i++){
        dataSet.push(data[i]);
      }
      let query = 'select d.data, w.writer_name from dataWriter d join writer w where d.writer = w.writer_id order by d.data asc , d.writer asc';
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([dataSet,allcount,num,data,connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err});
    connection.release();
  })
  .then(([dataSet,allcount,num,data,connection]) => {
    // f_count : 해당페이지 list의 첫값 l_count : 해당페이지 list의 마지막 값
      let f_count = 10*(num-1);
      if( f_count+10 < allcount ){
        l_count = f_count+10;
      }
      else{
        l_count = allcount;
      }
      let resultSet = []; // 최종 list 배열
      let check; // 저자가 중복될때 한 저자에 대한 자료를 뽑아내기 위한 count
      for(let i=f_count ; i< l_count ; i++){ // 최종 list 추출
        check = 0;
        for(let j=0; j<data.length; j++){
          if(dataSet[i].data_id == data[j].data && check == 0){
            let result = {
              id: dataSet[i].data_id,
              title: dataSet[i].data_title,
              writer: data[j].writer_name,
              type: dataSet[i].data_type,
              lmd: dataSet[i].data_lmd,
              dept: dataSet[i].data_dept,
              topic: dataSet[i].data_topic,
              subtopic: dataSet[i].data_subtopic
            };
            resultSet.push(result);
            check++;
          }
        }
      }
      res.status(200).send({ result: resultSet, allcount:allcount, message: 'ok' });
      connection.release();
  })
})

// title asc/desc
router.get('/title/:num/:count', function(req, res){
  if( req.params.count === '0' ){ // 0 이면 내림차순
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
        let query = 'select  data_id, data_title, data_type, data_lmd, data_dept, data_topic, data_subtopic from data order by data_title desc ';
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
      return new Promise((fulfill, reject) => {
        let dataSet = [];
        let allcount = data.length;
        for(let i=0; i<data.length; i++){
          dataSet.push(data[i]);
        }
        let query = 'select d.data, w.writer_name from dataWriter d join writer w where d.writer = w.writer_id order by d.data asc , d.writer asc';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([dataSet,allcount,num,data,connection]);
        })
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err});
      connection.release();
    })
    .then(([dataSet,allcount,num,data,connection]) => {
        let f_count = 10*(num-1);
        if( f_count+10 < allcount ){
          l_count = f_count+10;
        }
        else{
          l_count = allcount;
        }
        let resultSet = [];
        let check;
        for(let i=f_count ; i< l_count ; i++){
          check = 0;
          for(let j=0; j<data.length; j++){
            if(dataSet[i].data_id == data[j].data && check == 0){
              let result = {
                id: dataSet[i].data_id,
                title: dataSet[i].data_title,
                writer: data[j].writer_name,
                type: dataSet[i].data_type,
                lmd: dataSet[i].data_lmd,
                dept: dataSet[i].data_dept,
                topic: dataSet[i].data_topic,
                subtopic: dataSet[i].data_subtopic
              };
              resultSet.push(result);
              check++;
            }
          }
        }
        res.status(200).send({ result: resultSet, allcount:allcount, message: 'ok' });
        connection.release();
    })
  }
  else{ // 1이면 오름차순
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
        let query = 'select  data_id, data_title, data_type, data_lmd, data_dept, data_topic, data_subtopic from data order by data_title asc ';
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
      return new Promise((fulfill, reject) => {
        let dataSet = [];
        let allcount = data.length;
        for(let i=0; i<data.length; i++){
          dataSet.push(data[i]);
        }
        let query = 'select d.data, w.writer_name from dataWriter d join writer w where d.writer = w.writer_id order by d.data asc , d.writer asc';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([dataSet,allcount,num,data,connection]);
        })
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err});
      connection.release();
    })
    .then(([dataSet,allcount,num,data,connection]) => {
        let f_count = 10*(num-1);
        if( f_count+10 < allcount ){
          l_count = f_count+10;
        }
        else{
          l_count = allcount;
        }
        let resultSet = [];
        let check;
        for(let i=f_count ; i< l_count ; i++){
          check = 0;
          for(let j=0; j<data.length; j++){
            if(dataSet[i].data_id == data[j].data && check == 0){
              let result = {
                id: dataSet[i].data_id,
                title: dataSet[i].data_title,
                writer: data[j].writer_name,
                type: dataSet[i].data_type,
                lmd: dataSet[i].data_lmd,
                dept: dataSet[i].data_dept,
                topic: dataSet[i].data_topic,
                subtopic: dataSet[i].data_subtopic
              };
              resultSet.push(result);
              check++;
            }
          }
        }
        res.status(200).send({ result: resultSet, allcount:allcount, message: 'ok' });
        connection.release();
    })
  }
})

// writer asc/desc
router.get('/writer/:num/:count', function(req, res){
  if( req.params.count === '0' ){
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
        // allcount를 위해 모든자료 select
        let query = 'select  data_id, data_title, data_type, data_lmd, data_dept, data_topic, data_subtopic from data';
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
      return new Promise((fulfill, reject) => {
        let dataSet = [];
        let allcount = data.length; // 총 자료 갯수
        for(let i=0; i<data.length; i++){ // 자료정보 dataSet에 옮기기
          dataSet.push(data[i]);
        }
        // 작성자 내림차순 정렬 후 작성자를 꺼내기 위해 조인 후 자료 id와 해당자료의 작성자 이름 추출
        let query = 'select d.data, w.writer_name from dataWriter d join writer w where d.writer = w.writer_id order by d.writer desc';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([dataSet,allcount,num,data,connection]);
        })
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err});
      connection.release();
    })
    .then(([dataSet,allcount,num,data,connection]) => {
        let f_count = 10*(num-1); // f_count : 요청페이지의 처음 count l_count : 요청페이지의 마지막 count
        if( f_count+10 < allcount ){
          l_count = f_count+10;
        }
        else{
          l_count = allcount;
        }
        let resultSet = []; // 요청 페이지의 리스트 10개를 담는 배열
        let dataWriter = []; // 리스트 전부를 담는 배열
        let check; // 작성자가 중복될때 걸러내기 위한 count용 integer
        let trigger = []; // 작성자가 2개 이상인 자료를 걸러내기위한 배열
        let writerSet = []; // 아래 알고리즘으로 걸러낸 작성자 배열 ( [dataid , writername])

        for(let i=0; i<data.length; i++){  // writerSet 배열을 만들기 위한 알고리즘
          check = 0;
          for(let j=0; j< trigger.length; j++){
            if(data[i].data == trigger[j]){
              check++;
            }
          }
          if(check == 0){
            trigger.push(data[i].data);
            writerSet.push(data[i]);
          }
        }
        for(let i = 0; i< writerSet.length ; i++){ // 모든 자료 리스트 추출 알고리즘
          for(let j = 0; j< allcount ; j++){
            if(writerSet[i].data == dataSet[j].data_id){
              let result = {
                id: dataSet[j].data_id,
                title: dataSet[j].data_title,
                writer: writerSet[i].writer_name,
                type: dataSet[j].data_type,
                lmd: dataSet[j].data_lmd,
                dept: dataSet[j].data_dept,
                topic: dataSet[j].data_topic,
                subtopic: dataSet[j].data_subtopic
              };
              dataWriter.push(result);
            }
          }
        }
        for(let i=f_count; i<l_count; i++){ // 모든 자료 리스트에서 해당 페이지 10개 제외하고 추출
          resultSet.push(dataWriter[i]);
        }
        res.status(200).send({ result: resultSet, allcount:allcount, message: 'ok' });
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
        let query = 'select  data_id, data_title, data_type, data_lmd, data_dept, data_topic, data_subtopic from data';
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
      return new Promise((fulfill, reject) => {
        let dataSet = [];
        let allcount = data.length;
        for(let i=0; i<data.length; i++){
          dataSet.push(data[i]);
        }
        let query = 'select d.data, w.writer_name from dataWriter d join writer w where d.writer = w.writer_id order by d.writer asc';
        connection.query(query, (err, data) => {
          if(err) reject([err, connection]);
          else fulfill([dataSet,allcount,num,data,connection]);
        })
      })
    })
    .catch(([err, connection]) => {
      res.status(400).send({ result: [], message: 'select query err : ' + err});
      connection.release();
    })
    .then(([dataSet,allcount,num,data,connection]) => {
        let f_count = 10*(num-1); // f_count : 요청페이지의 처음 count l_count : 요청페이지의 마지막 count
        if( f_count+10 < allcount ){
          l_count = f_count+10;
        }
        else{
          l_count = allcount;
        }
        let resultSet = []; // 요청 페이지의 리스트 10개를 담는 배열
        let dataWriter = []; // 리스트 전부를 담는 배열
        let check; // 작성자가 중복될때 걸러내기 위한 count용 integer
        let trigger = []; // 작성자가 2개 이상인 자료를 걸러내기위한 배열
        let writerSet = []; // 아래 알고리즘으로 걸러낸 작성자 배열 ( [dataid , writername])

        for(let i=0; i<data.length; i++){  // writerSet 배열을 만들기 위한 알고리즘
          check = 0;
          for(let j=0; j< trigger.length; j++){
            if(data[i].data == trigger[j]){
              check++;
            }
          }
          if(check == 0){
            trigger.push(data[i].data);
            writerSet.push(data[i]);
          }
        }
        for(let i = 0; i< writerSet.length ; i++){ // 모든 자료 리스트 추출 알고리즘
          for(let j = 0; j< allcount ; j++){
            if(writerSet[i].data == dataSet[j].data_id){
              let result = {
                id: dataSet[j].data_id,
                title: dataSet[j].data_title,
                writer: writerSet[i].writer_name,
                type: dataSet[j].data_type,
                lmd: dataSet[j].data_lmd,
                dept: dataSet[j].data_dept,
                topic: dataSet[j].data_topic,
                subtopic: dataSet[j].data_subtopic
              };
              dataWriter.push(result);
            }
          }
        }
        for(let i=f_count; i<l_count; i++){
          resultSet.push(dataWriter[i]);
        }
        res.status(200).send({ result: resultSet, allcount:allcount, message: 'ok' });
        connection.release();
    })
  }
})

module.exports = router;
