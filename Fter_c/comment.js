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

// 댓글 모두보기(+시간 계산 포함)
router.get('/:post_id' , (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'getConnection error : '+err}); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let postid = req.params.post_id;
      let query = 'select Comment.user_nick, User.profile, User.level, User.statemessage, Comment.content, Comment.written_time from User,Comment where User.nickname=Comment.user_nick and Comment.post_id = ? order by Comment.id desc';
        connection.query(query, postid, (err, data) => {
          if(err) res.status(500).send({ result: [], message: 'comment all fail: '+err });
          else{
            var written_time = []; // 작성 시간
            var record = []; // 객체 배열
            var now_time = new Date(); // 현재 시간
            var time_sub = 0; // 시간차

            for(var i=0;i<data.length;i++){
              written_time[i] =  data[i].written_time;
              if(moment(written_time[i]).date() != now_time.getDate()){ // 같은 날이 아니면 그냥 날짜를 넣어줌
                  written_time[i] =  moment(written_time[i]).format('YYYY-MM-DD');
              }
              else{
                if(moment(written_time[i]).hours()==now_time.getHours()){ // 같은 날이고 시각도 같다면
                  if(moment(written_time[i]).minutes() == now_time.getMinutes()){ // '분'까지 같다면
                    written_time[i] = "방금 전";
                  }
                  else{ // 같은 날이고 시각도 같은데 '분'이 다르면
                    time_sub = now_time.getMinutes() - moment(written_time[i]).minutes();
                    written_time[i] = time_sub+"분 전";
                  }
                }
                else{ // 같은 날이고 시각이 다르다면
                  time_sub = (now_time.getHours()*60 + now_time.getMinutes()) - ( moment(written_time[i]).hours()*60 + moment(written_time[i]).minutes());
                  if(time_sub >= 60){ // 두 시각의 차이가 60분이 넘는다면
                    time_sub = now_time.getHours() - moment(written_time[i]).hours();
                    written_time[i] = time_sub+"시간 전";
                  }
                  else{ // 두 시각의 차이가 60분이 넘지 않는다면
                    time_sub = (now_time.getMinutes()+60) - moment(written_time[i]).minutes();
                    written_time[i] = time_sub+"분 전";
                  }
                }
              }
            }

            for(var j=0;j<data.length;j++){
              record[j]={
                user_nick: data[j].user_nick,
                level: data[j].level,
                statemessage: data[j].statemessage,
                image: data[j].profile,
                content: data[j].content,
                written_time: written_time[j]
              };
            }
            res.status(200).send({ result : record, message: 'ok' });
          }
          connection.release();
        });
    });
  })
});

// 댓글작성 트랜잭션
router.post('/add', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: 'getConnection err: ' + err}); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      connection.beginTransaction(err => {
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => { res.status(500).send({ message: 'begin transaction err' + err}); connection.release(); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'insert into Comment set ? ';
      let record = {
        user_nick: req.body.user_nick,
        post_id: req.body.post_id,
        useful: req.body.useful,
        content: req.body.content,
        written_time: moment(new Date()).format('YYYY-MM-DD, HH:mm')
      };
      connection.query(query,record,(err, data) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ message: "insert CommentInfo err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query2 = 'update Post set commentcount=commentcount+1 where id=?';
      connection.query(query2, req.body.post_id, (err, data2) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      })
    })
  })
  .catch(([err, connection]) => {
    res.status(500).send({ message: "update commentcount err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query3 = 'select Post.user_nick, Comment.id from Post,Comment where Post.id = ? and Post.id = Comment.post_id order by Comment.id desc';
      connection.query(query3, req.body.post_id, (err, data3) => {
        if(err) reject([err, connection]);
        else fulfill([data3, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ message: "select AlarmInfo err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data3, connection]) => {
    return new Promise((fulfill, reject) => {
      if(req.body.user_nick == data3[0].user_nick){
        res.status(200).send({ message: 'ok' });
        connection.release();
      }
      else{
        let query4 = 'insert into Alarm set ? ';
        let alarminfo = {
          user_nick: data3[0].user_nick,
          comment_id: data3[0].id
        };
        connection.query(query4, alarminfo, (err, data4) => {
          if(err) {
            res.status(500).send({ message: 'insert alarminfo err : ' + err});
            connection.rollback();
          }
          else{
            res.status(203).send({ message: 'ok'});
            connection.commit();
          }
          connection.release();
        });
      }
    });
  })
})

//유용한댓글 모두보기
router.get('/useful/:postid' , (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'getConnection error : '+err}); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let postid = req.params.postid;
      let query = 'select Comment.user_nick, User.profile, User.level, User.statemessage, Comment.content, Comment.written_time from User,Comment where User.nickname=Comment.user_nick and Comment.useful = 1 and Comment.post_id = ? order by Comment.id desc';
        connection.query(query, postid, (err, data) => {
          if(err) res.status(500).send({ result: [], message: 'comment all fail: '+err });
          else{
            var written_time = []; // 작성 시간
            var record = []; // 객체 배열
            var now_time = new Date(); // 현재 시간
            var time_sub = 0; // 시간차

            console.log(now_time);
            for(var i=0;i<data.length;i++){
              written_time[i] =  data[i].written_time;
              if(moment(written_time[i]).date() != now_time.getDate()){ // 같은 날이 아니면 그냥 날짜를 넣어줌
                  written_time[i] = moment(written_time[i]).format('YYYY-MM-DD');
              }
              else{
                if(moment(written_time[i]).hours()==now_time.getHours()){ // 같은 날이고 시각도 같다면
                  if(moment(written_time[i]).minutes() == now_time.getMinutes()){ // '분'까지 같다면
                    written_time[i] = "방금 전";
                  }
                  else{ // 같은 날이고 시각도 같은데 '분'이 다르면
                    time_sub = now_time.getMinutes() - moment(written_time[i]).minutes();
                    written_time[i] = time_sub+"분 전";
                  }
                }
                else{ // 같은 날이고 시각이 다르다면
                  time_sub = (now_time.getHours()*60 + now_time.getMinutes()) - ( moment(written_time[i]).hours()*60 + moment(written_time[i]).minutes());
                  if(time_sub >= 60){ // 두 시각의 차이가 60분이 넘는다면
                    time_sub = now_time.getHours() - moment(written_time[i]).hours();
                    written_time[i] = time_sub+"시간 전";
                  }
                  else{ // 두 시각의 차이가 60분이 넘지 않는다면
                    time_sub = (now_time.getMinutes()+60) - moment(written_time[i]).minutes();
                    written_time[i] = time_sub+"분 전";
                  }
                }
              }
            }

            for(var j=0;j<data.length;j++){
              record[j]={
                user_nick: data[j].user_nick,
                image: data[j].profile,
                level: data[j].level,
                statemessage: data[j].statemessage,
                content: data[j].content,
                written_time: written_time[j]
              };
            }
            res.status(200).send({ result : record, message: 'ok' });
          }
          connection.release();
        });
    });
  })
});




module.exports = router;
