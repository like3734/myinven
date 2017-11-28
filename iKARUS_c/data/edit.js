const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');


// data edit view
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
    return new Promise((fulfill, reject) => {
      let query = 'select w.writer_name, w.writer_belong from writer w join dataWriter a where a.data = ? and a.writer = w.writer_id';
      connection.query(query, req.params.num, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err });
    connection.release();
  })
  .then(([data, connection]) => {
    return new Promise((fulfill, reject) => {
      let writer_ary = data;
      let query2 = 'select * from groupaccess where data = ? ';
      connection.query(query2, req.params.num, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, writer_ary, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err });
    connection.release();
  })
  .then(([data, writer_ary, connection]) => {
    return new Promise((fulfill, reject) => {
      let group_ary = [];
      for(let i=0; i<data.length; i++){
        group_ary.push(data[i].group);
      }
      let query = 'select data_title, data_intro, data_period, data_cost, data_type, data_contents, data_thumbnail, data_dept, data_topic, data_subtopic, data_basicAccess, data_codeAccess from data where data_id = ?';
      connection.query(query, req.params.num, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, group_ary, writer_ary, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err});
    connection.release();
  })
  .then(([data, group_ary, writer_ary, connection]) => {
    let writerSet = [];
    for(let i = 0; i< writer_ary.length; i++){
      let writer = {
        name: writer_ary[i].writer_name,
        belong: writer_ary[i].writer_belong
      };
      writerSet.push(writer);
    }
    let basicAccess = JSON.parse(data[0].data_basicAccess);
    let dataSet = {
      title: data[0].data_title,
      intro: data[0].data_intro,
      period: data[0].data_period,
      cost: data[0].data_cost,
      type: data[0].data_type,
      data: data[0].data_contents,
      thumbnail: data[0].data_thumbnail,
      dept: data[0].data_dept,
      topic: data[0].data_topic,
      subtopic: data[0].data_subtopic,
      basicAccess: basicAccess,
      codeAccess: data[0].data_codeAccess,
      writer: writerSet,
      group: group_ary
    };
    res.status(200).send({ result: dataSet, message: 'ok' });
    connection.release();
  })
})

// edit request (data url)
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
      if( req.body.new_category.length !== 0){
        new_category = JSON.parse(req.body.new_category);
      }
      if(new_category.length !== 0){
        let query = 'insert category set ?';
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
      let query = 'delete from dataWriter where data = ?';
      connection.query(query, req.body.id, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: ' query err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'delete from groupaccess where data = ? ';
      connection.query(query, req.body.id, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: ' delete query err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let today = new Date();
      today = moment(today).format('YYYYMMDD');
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
      let query = 'update data set ? where data_id = ? ';
      connection.query(query, [new_data, req.body.id], (err, data) => {
        if(err) reject([err, connection]);
        else{
          fulfill([data, connection]);
        }
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'update query err : ' + err });
    connection.rollback();
    connection.release();
  })
  .then(([data, connection]) => {
    return new Promise((fulfill, reject) => {
      let new_id = req.body.id;
      let writer_ary = [];
      let writerSet = [];
      if(req.body.writer.length !== 0){
        writerSet = JSON.parse(req.body.writer);
      }
      if(writerSet.length !== 0){
        for(let i=0; i<writerSet.length; i++){
          if( i !== writerSet.length-1){
            let name = writerSet[i].name;
            let belong = writerSet[i].belong;
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
      let query = 'insert into dataWriter set ? ';
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
    let query = 'insert into groupaccess set ? ';
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
