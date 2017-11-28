const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

// data search
router.post('/', function(req, res){
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    })
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err });
  })
  .then((connection) => { // 해당 검색어에 해당되는 자료의 id 추출
    return new Promise((fulfill, reject) => {
      let num = req.body.num;
      let query = 'select data_id from data where (data_title LIKE "%"?"%" or data_intro LIKE "%"?"%")';
      connection.query(query, [req.body.search, req.body.search], (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, num, connection]);
      });
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ result: [], message: 'select query err : ' + err });
    connection.release();
  })
  .then(([data, num, connection]) => { // 해당 검색어에 해당되는 저자를 포함하는 자료의 id 추출
    return new Promise((fulfill, reject) => {
      let data_ary = [];
      for(let i=0; i<data.length; i++){ // 자료의 id list data_ary로 옮기기
        data_ary.push(data[i].data_id);
      }
      let query = 'select d.data from dataWriter d join writer w where d.writer = w.writer_id and (w.writer_name LIKE "%"?"%")';
      connection.query(query, req.body.search, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, data_ary, num, connection]);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err});
    connection.release();
  })
  .then(([data, data_ary, num, connection]) => {
    return new Promise((fulfill, reject) => {
      let count = 0;
      if(data_ary.length + data.length == 0){ // 검색결과 없을 때
        res.status(204).send({ message: 'not data'});
        connection.release();
      }
      //var i,j=0;
      for(let i=0; i<data.length; i++){ // 해당 저자를 포함하는 자료 id 중에서 중복이 되지 않은 id를 data_ary에 추가
        for(let j=0; j<data_ary.length; j++){
          if(data[i].data == data_ary[j]){
            count++;
          }
        }
        if(count == 0){
          data_ary.push(data[i].data);
        }
        else{
          count = 0;
        }
      }
      var i,j=0;
      while(j < data_ary.length-1){ // bubble sorting 자료를 최신순으로 뽑기위한 작업
        for(i=0; i<data_ary.length-j; i++){
          if(data_ary[i] < data_ary[i+1]){
            let temp = data_ary[i+1];
            data_ary[i+1] = data_ary[i];
            data_ary[i] = temp;
          }
        }
        j++;
      }
      let list = []; // 해당 page의 10개 자료 id 배열
      let f_count = 10*(num-1);
      let l_count = 0;
      let allcount = data_ary.length;
      if( f_count+10 < allcount){
        l_count = f_count+10;
      }
      else{
        l_count = allcount;
      }
      for(let i=f_count; i<l_count; i++){
        list.push(data_ary[i]);
      }
      let dataInfo = [];
      let query = 'select data_id, data_title, data_type, data_lmd, data_dept, data_topic, data_subtopic from data where data_id = ?';
      for(let k=0; k<list.length; k++){ // 10개의 자료 데이터 추출
        if(k !== list.length-1){
          connection.query(query, list[k], (err, data) => {
            if(err) reject([err, connection]);
            else{
              dataInfo.push(data[0]);
            }
          })
        }
        else{
          connection.query(query, list[k], (err, data) => {
            if(err) reject([err, connection]);
            else {
              dataInfo.push(data[0]);
              fulfill([dataInfo, list, allcount, connection]);
            }
          })
        }
      }
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err});
    connection.release();
  })
  .then(([dataInfo, list, allcount, connection]) => {
    return new Promise((fulfill, reject) => {
      let writerInfo = [];
      let query = 'select d.data, d.writer, w.writer_name from dataWriter d join writer w where d.writer = w.writer_id and d.data = ? order by d.writer desc';
      for(let k=0; k<list.length; k++){ // 10개의 저자이름 추출
        if(k !== list.length-1){
          connection.query(query, list[k], (err, data) => {
            if(err) reject([err, connection]);
            else{
              writerInfo.push(data[0]);
            }
          })
        }
        else{
          connection.query(query, list[k], (err, data) => {
            if(err) reject([err, connection]);
            else {
              writerInfo.push(data[0]);
              fulfill([dataInfo, writerInfo, allcount, connection]);
            }
          })
        }
      }
    })
  })
  .catch(([err, connection]) => {
    res.status(400).send({ message: 'select query err : ' + err});
    connection.release();
  })
  .then(([dataInfo, writerInfo, allcount, connection]) => {
    let resultSet = [];
    let check = 0;

    for(let i=0; i<dataInfo.length; i++){ // 뽑은 데이터 합치기
      check = 0;
      for(let j=0; j<writerInfo.length; j++){
        if(dataInfo[i].data_id == writerInfo[j].data && check == 0){
          let result = {
            id: dataInfo[i].data_id,
            title: dataInfo[i].data_title,
            writer: writerInfo[j].writer_name,
            type: dataInfo[i].data_type,
            lmd: dataInfo[i].data_lmd,
            dept: dataInfo[i].data_dept,
            topic: dataInfo[i].data_topic,
            subtopic: dataInfo[i].data_subtopic
          };
          resultSet.push(result);
          check++;
        }
      }
    }
    res.status(200).send({ result: resultSet, allcount: allcount, message: 'ok' });
    connection.release();
  })
})

module.exports = router;
