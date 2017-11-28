const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');

// 자료등록 및 수정 화면
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
    return new Promise((fulfill, reject) => {
      let query = 'select * from category'; // category정보 추출
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err });
    connection.release();
  })
  .then(([data, connection]) => {
    return new Promise((fulfill, reject) => {
      let dept = [];
      let topic = [];
      let subtopic = [];
      for(let i=1; i<data.length; i++){ // 분과, 주제, 하위주제 각각 array로 push
        if(data[i].parents == "분과" ){
          dept.push(data[i].name);
        }
        else if(data[i].parents == "주제"){
          topic.push(data[i].name);
        }
        else{
          let sub = {
            parents: data[i].parents,
            name: data[i].name
          };
          subtopic.push(sub);
        }
      }
      let query = 'select * from groupinfo'; // group 정보 추출
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([dept,topic,subtopic,data,connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err});
    connection.release();
  })
  .then(([dept, topic, subtopic, data, connection]) => {
    return new Promise((fulfill, reject) => {
      let group = [];
      for(let i=0; i<data.length; i++){
        group.push(data[i].group_name);
      }
      let query = 'select writer_name, writer_belong from writer ';
      connection.query(query, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([dept, topic, subtopic, group, data, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err});
    connection.release();
  })
  .then(([dept,topic,subtopic,group,data,connection]) => {
    let writerInfo = [];
    for(let i=0; i<data.length; i++){
      let writer = {
        name: data[i].writer_name,
        belong: data[i].writer_belong
      };
      writerInfo.push(writer);
    }
    res.status(200).send({ dept:dept, topic:topic, subtopic:subtopic, group:group, writer:writerInfo, message: 'ok' });
    connection.release();
  })
})

// data register ( data url )
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
    res.status(500).send({ message : 'beginTransaction err : ' + err});
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
      let new_category = [];
      if( req.body.new_category.length !== 0){ // 추가해야할 카테고리가 있는지 확인 후 있으면 parsing
        new_category = JSON.parse(req.body.new_category);
      }
      if(new_category.length !== 0){
        let query = 'insert category set ?'; // category insert
        for(let i=0; i<new_category.length; i++){
          if(i !== new_category.length -1){
            connection.query(query, new_category[i], (err, data) => {
              if(err) reject([err, connection]);
            })
          }
          else{
            connection.query(query, new_category[i], (err, data) => {
              if(err) reject([err, connection]);
              fulfill(connection);
            })
          }
        }
      }
      else{
        fulfill(connection);
      }
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'new category insert query err : ' + err});
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let today = new Date();
      today = moment(today).format('YYYYMMDD'); // last modified  data (lmd) 추출
      let new_data = {
        data_title: req.body.title,
        data_intro: req.body.intro,
        data_period: req.body.period,
        data_lmd: today,
        data_cost: req.body.cost,
        data_type: req.body.type,
        data_contents: req.body.data,
        data_thumbnail: req.body.thumbnail,
        data_dept: req.body.dept,
        data_topic: req.body.topic,
        data_subtopic: req.body.subtopic,
        data_basicAccess: req.body.basicAccess,
        data_codeAccess: req.body.codeAccess
      };
      let query = 'insert into data set ? '; // 새로운 자료 insert
      connection.query(query, new_data, (err, data) => {
        if(err) reject([err, connection]);
        else{
          fulfill([data, connection]);
        }
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'insert query err' + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, connection]) => {
    return new Promise((fulfill, reject)=>{
      let query = 'select data_id from data order by data_id desc'; // 지금 새로 저장할 자료의 id 추출
      connection.query(query, (err, data)=>{
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(([data, connection]) => {
    return new Promise((fulfill, reject) => {
      let new_id = data[0].data_id;
      let writer_ary = [];
      let writerSet = [];
      if( req.body.writer.length !== 0 ){ // 저자가있다면 writer parsing
        writerSet = JSON.parse(req.body.writer);
      }
      if(writerSet.length !== 0){
        for(let i=0; i<writerSet.length; i++){
          if( i !== writerSet.length-1){
            let name = writerSet[i].name;
            let belong = writerSet[i].belong; // 해당 저자들의 id 추출
            let query = ' select writer_id from writer where writer_name = ? and writer_belong = ? ';
            connection.query(query, [name, belong], (err, data) => {
              if(err){
                res.status(400).send({ message: 'fail' });
                connection.rollback();
                connection.release();
              }
              else{
                writer_ary.push(data[0].writer_id);
              }
            })
          }
          else{
            let name = writerSet[i].name;
            let belong = writerSet[i].belong;
            let query = ' select writer_id from writer where writer_name = ? and writer_belong = ? ';
            connection.query(query, [name, belong], (err, data) => {
              if(err){
                reject([err, connection]);
              }
              else{
                writer_ary.push(data[0].writer_id);
                fulfill([new_id, writer_ary, connection]);
              }
            })
          }
        }
      }
      else{
        fulfill([new_id, writer_ary, connection]);
      }
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'query err : ' + err});
    connection.rollback();
    connection.release();
  })
  .then(([new_id, writer_ary, connection]) => {
    return new Promise((fulfill, reject) => {
      let query = 'insert into dataWriter set ? '; // insert dataWriter Info
      if(writer_ary.length !== 0){
        for(let i=0; i<writer_ary.length; i++){
          if( i !== writer_ary.length-1){
            let dataWriterSet= {
              data: new_id,
              writer: writer_ary[i]
            };
            connection.query(query, dataWriterSet, (err, data) => {
              if(err){
                res.status(400).send({ message: 'fail'});
                connection.rollback();
                connection.release();
              }
            })
          }
          else{
            let dataWriterSet= {
              data: new_id,
              writer: writer_ary[i]
            };
            connection.query(query, dataWriterSet, (err, data) => {
              if(err){
                reject([err, connection]);
              }
              else{
                fulfill([new_id, connection]);
              }
            })
          }
        }
      }
      else{
        fulfill([new_id, connection]);
      }
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'fail' });
    connection.rollback();
    connection.release();
  })
  .then(([new_id, connection]) => {
    let group = [];
    if(req.body.group.length !== 0){
      group = JSON.parse(req.body.group);
    }
    let query = 'insert into groupaccess set ? '; // group info insert
    if(group.length !== 0){
      for(let i=0; i< group.length; i++){
        if(i !== group.length-1){
          let groupSet = {
            data: new_id,
            group: group[i]
          };
          connection.query(query, groupSet, (err, data) => {
            if(err){
              res.status(400).send({ message: 'fail' });
              connection.rollback();
              connection.release();
            }
          })
        }
        else{
          let groupSet = {
            data: new_id,
            group: group[i]
          };
          connection.query(query, groupSet, (err, data) => {
            if(err){
              res.status(400).send({ message: 'fail' });
              connection.rollback();
              connection.release();
            }
            else{
              res.status(201).send({ message: 'ok' });
              connection.commit();
              connection.release();
            }
          })
        }
      }
    }
    else{
      res.status(201).send({ message: 'ok' });
      connection.commit();
      connection.release();
    }
  })
})



module.exports = router;
