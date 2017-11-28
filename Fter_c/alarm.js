const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const multer = require('multer');
const multerS3 = require('multer-s3');
//const bcrypt = require('bcrypt');
const saltRounds = 10;
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'sjibk',
    acl: 'public-read',
    key: function(req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});



// 알람창
router.get('/:user_nick', function(req, res) {
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else fulfill(connection);
      })
    })
    .catch(err => {
      res.status(500).send({ result: [], message: 'getConnection error : ' + err });
    })
    .then((connection) => {
      return new Promise((fulfill, reject) => {
        let usernick = req.params.user_nick;
        let query = 'select  Alarm.id, Alarm.comment_id, Alarm.readinfo, Comment.written_time from Comment, Alarm where Alarm.comment_id = Comment.id and Alarm.user_nick = ? order by Comment.written_time desc';
        let query2 = 'select Post.id as pid , Post.title, Comment.id as cid from Comment,Post where Post.id = Comment.post_id ';
        connection.query(query, usernick, function(err, data) {
          if (err) res.status(500).send({ result: [], message: 'select error : ' + err});
          else{
            let ary_alarminfo = [];
            let readcount=0;
            for(var a in data){
              let alarminfo = {
                id: data[a].id,
                commentid: data[a].comment_id,
                readinfo: data[a].readinfo,
                written_time: data[a].written_time,
              };
              ary_alarminfo.push(alarminfo);
            }
            connection.query(query2, (err, data2) => {
              if(err) res.status(500).send({ result: [], message: 'select2 error : ' + err});
              else{
                let ary_postinfo= [];
                let ary_allinfo = [];
                let written_time = [];
                var now_time = new Date();
                let time_sub;
                for(var b in ary_alarminfo){
                  for(var c in data2){
                    if( ary_alarminfo[b].commentid === data2[c].cid ){
                      let postinfo = {
                        postid: data2[c].pid,
                        title: data2[c].title
                      };
                      ary_postinfo.push(postinfo);
                    }
                  }
                  if( ary_alarminfo[b].readinfo === 0 ) readcount++;
                }
                for(var d in ary_alarminfo){
                  written_time[d] = ary_alarminfo[d].written_time;
                  if(moment(written_time[d]).date() !== now_time.getDate())
                    written_time[d] = moment(written_time[d]).format('YYYY-MM-DD');
                  else{
                    if(moment(written_time[d]).hours() === now_time.getHours()){
                      if(moment(written_time[d]).minutes() === now_time.getMinutes()){
                        written_time[d] = "방금 전";
                      }
                      else{
                        time_sub = now_time.getMinutes() - moment(written_time[d]).minutes();
                        written_time[d] = time_sub+"분 전";
                      }
                    }
                    else{ // 같은 날이고 시각이 다르다면
                      time_sub = (now_time.getHours()*60 + now_time.getMinutes()) - ( moment(written_time[d]).hours()*60 + moment(written_time[d]).minutes());
                      if(time_sub >= 60){ // 두 시각의 차이가 60분이 넘는다면
                        time_sub = now_time.getHours() - moment(written_time[d]).hours();
                        written_time[d] = time_sub+"시간 전";
                      }
                      else{ // 두 시각의 차이가 60분이 넘지 않는다면
                        time_sub = (now_time.getMinutes()+60) - moment(written_time[d]).minutes();
                        written_time[d] = time_sub+"분 전";
                      }
                    }
                  }

                  let allinfo = {
                    id: ary_alarminfo[d].id,
                    readinfo: ary_alarminfo[d].readinfo,
                    written_time: written_time[d],
                    postid: ary_postinfo[d].postid,
                    title: ary_postinfo[d].title
                  };
                  ary_allinfo.push(allinfo);
                }

                res.status(200).send({ count: readcount, result: ary_allinfo, message: 'ok'});
              }
              connection.release();
            });
          } // query1 else
        });
      });
    })
})



// 알람창에서 게시글 넘어갈 때
router.get('/readinfo/:alarm_id' , (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: "get Connection err : " + err}) ; })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'update Alarm set readInfo=1 where id = ?';
      connection.query(query, req.params.alarm_id, (err, data) => {
        if(err) res.status(500).send({ message: 'fail' });
        else res.status(200).send({ message: 'ok' });
        connection.release();
      });
    });
  })
})

module.exports = router;
