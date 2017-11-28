const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
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

// 메인 List 띄워주기 최신순
router.get('/partlatest/:user_nick/:part', (req, res) => {
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
      connection.beginTransaction(err => { //트랜잭션 작업을 시작합니다.
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'beginning transaction error: '+err}); connection.release(); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select User.part, User.level, User.nickname, User.profile, User.statemessage, Post.id, Post.title, Post.contents, Post.likecount, Post.commentcount, Post.written_time, Post.image1, Post.image2, Post.image3, Post.image4, Post.image5 from User, Post where User.nickname = Post.user_nick and Post.part = ? order by Post.id desc';
      connection.query(query, req.params.part, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data,connection]) => {
    return new Promise((fulfill, reject) => {
      let query2 = 'select post_id from PostLikeCount where user_nick = ? ';
      connection.query(query2, req.params.user_nick, (err, data2) => {
        if(err) reject([err, connection]);
        else fulfill([data, data2, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query2 err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, data2, connection]) => {
    return new Promise((fulfill, reject) => {
      let likeunlike = [];
      for (var b in data) {
        likeunlike[b] = 0;
        for (var c in data2) {
          if (data[b].id === data2[c].post_id) {
            likeunlike[b] = 1;
          }
        }
      }
      let query3 = 'select post_id from FavoritePost where user_nick = ? ';
      connection.query(query3, req.params.user_nick, (err, data3) => {
        if(err) reject([err, connection]);
        else fulfill([data, likeunlike, data3, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query3 err: " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, likeunlike, data3, connection]) => {
    return new Promise((fulfill, reject) => {
      let markunmark = [];
      let getallinfo = [];
      let ary_image = [];
      let imageInfo = [];
      let imagecount;
      for(let idx=0; idx<data.length; idx++){
        ary_image[idx] = new Array();
      }
      for(let idx=0; idx<data.length; idx++){
        imageInfo[idx] = new Array();
      }
      for (var b in data) {
        markunmark[b] = 0;
        for (var c in data3) {
          if (data[b].id === data3[c].post_id) {
            markunmark[b] = 1;
          }
        }
      }
      for (var c in data) {
        imageInfo[c].push(data[c].image1);
        imageInfo[c].push(data[c].image2);
        imageInfo[c].push(data[c].image3);
        imageInfo[c].push(data[c].image4);
        imageInfo[c].push(data[c].image5);
      }
      for(var d in data){
        imagecount=0;
        for(let f=0 ; f < 5 ; f++ )
        if( imageInfo[d][f] !== null){
          ary_image[d][imagecount]=imageInfo[d][f];
          imagecount++;
        }
      }
      for( var e in data) {
        let info = {
          part: data[e].part,
          level: data[e].level,
          nickname: data[e].nickname,
          profile: data[e].profile,
          statemessage: data[e].statemessage,
          id: data[e].id,
          user_nick: data[e].user_nick,
          title: data[e].title,
          contents: data[e].contents,
          likecount: data[e].likecount,
          commentcount: data[e].commentcount,
          written_time: data[e].written_time,
          likecheck: likeunlike[e],
          markcheck: markunmark[e],
          image: ary_image[e]
        };
        getallinfo.push(info);
      }
      let query4 = 'select Comment.post_id, Comment.user_nick, Comment.content, Comment.written_time, User.profile, User.level, User.statemessage from User, Comment where User.nickname = Comment.user_nick order by Comment.id desc';
      connection.query(query4, getallinfo, function(err, data4) {
        if(err){ res.status(500).send({ result: [], message: ' query4 error : ' + err}); connection.rollback(); }
        else
        {
        ary_allinfo = [];
        let arylength = getallinfo.length;
        let ary_commentinfo = [];
        for(let idx=0; idx<arylength; idx++){
          ary_commentinfo[idx] = new Array();
        }
        let count;
        let now_time = new Date();
        let time_sub;
        let written_time = [];
        for(var i=0;i<data4.length;i++){
          written_time[i] =  data4[i].written_time;
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
        for (var b in getallinfo) {
          count = 0;
          for (let c = 0; c < data4.length; c++) {
            if (count !== 2 && getallinfo[b].id === data4[c].post_id) {
              let commentinfo = {
                user_nick: data4[c].user_nick,
                content: data4[c].content,
                image: data4[c].profile,
                level: data4[c].level,
                written_time: written_time[c],
                statemessage: data4[c].statemessage
              };
              ary_commentinfo[b][count] = commentinfo;
              count++;
            };
          }
        }
        for(var d in getallinfo) {
          let allinfo = {
            postinfo: getallinfo[d],
            commentinfo: ary_commentinfo[d]
          };
          ary_allinfo[d] = allinfo;
        }
        res.status(203).send({ result: ary_allinfo, message: 'ok' });
        connection.commit();
      }
      connection.release();
      });
    });
  })
})

// 메인 List 인기순
router.get('/partpopular/:user_nick/:part', (req, res) => {
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
      connection.beginTransaction(err => { //트랜잭션 작업을 시작합니다.
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'beginning transaction error: '+err}); connection.release(); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select User.part, User.level, User.nickname, User.profile, User.statemessage, Post.id, Post.title, Post.contents, Post.likecount, Post.commentcount, Post.written_time, Post.image1, Post.image2, Post.image3, Post.image4, Post.image5 from User, Post where User.nickname = Post.user_nick and Post.part = ? order by Post.likecount desc';
      connection.query(query, req.params.part, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data,connection]) => {
    return new Promise((fulfill, reject) => {
      let query2 = 'select post_id from PostLikeCount where user_nick = ? ';
      connection.query(query2, req.params.user_nick, (err, data2) => {
        if(err) reject([err, connection]);
        else fulfill([data, data2, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query2 err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, data2, connection]) => {
    return new Promise((fulfill, reject) => {
      let likeunlike = [];
      for (var b in data) {
        likeunlike[b] = 0;
        for (var c in data2) {
          if (data[b].id === data2[c].post_id) {
            likeunlike[b] = 1;
          }
        }
      }
      let query3 = 'select post_id from FavoritePost where user_nick = ? ';
      connection.query(query3, req.params.user_nick, (err, data3) => {
        if(err) reject([err, connection]);
        else fulfill([data, likeunlike, data3, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query3 err: " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, likeunlike, data3, connection]) => {
    return new Promise((fulfill, reject) => {
      let markunmark = [];
      let getallinfo = [];
      let ary_image = [];
      let imageInfo = [];
      let imagecount;
      for(let idx=0; idx<data.length; idx++){
        ary_image[idx] = new Array();
      }
      for(let idx=0; idx<data.length; idx++){
        imageInfo[idx] = new Array();
      }
      for (var b in data) {
        markunmark[b] = 0;
        for (var c in data3) {
          if (data[b].id === data3[c].post_id) {
            markunmark[b] = 1;
          }
        }
      }
      for (var c in data) {
        imageInfo[c].push(data[c].image1);
        imageInfo[c].push(data[c].image2);
        imageInfo[c].push(data[c].image3);
        imageInfo[c].push(data[c].image4);
        imageInfo[c].push(data[c].image5);
      }
      for(var d in data){
        imagecount=0;
        for(let f=0 ; f < 5 ; f++ )
        if( imageInfo[d][f] !== null){
          ary_image[d][imagecount]=imageInfo[d][f];
          imagecount++;
        }
      }
      for( var e in data) {
        let info = {
          part: data[e].part,
          level: data[e].level,
          nickname: data[e].nickname,
          profile: data[e].profile,
          statemessage: data[e].statemessage,
          id: data[e].id,
          user_nick: data[e].user_nick,
          title: data[e].title,
          contents: data[e].contents,
          likecount: data[e].likecount,
          commentcount: data[e].commentcount,
          written_time: data[e].written_time,
          likecheck: likeunlike[e],
          markcheck: markunmark[e],
          image: ary_image[e]
        };
        getallinfo.push(info);
      }
      let query4 = 'select Comment.post_id, Comment.user_nick, Comment.content, Comment.written_time, User.profile, User.level, User.statemessage from User, Comment where User.nickname = Comment.user_nick order by Comment.id desc';
      connection.query(query4, getallinfo, function(err, data4) {
        if(err){ res.status(500).send({ result: [], message: ' query4 error : ' + err}); connection.rollback(); }
        else
        {
        ary_allinfo = [];
        let arylength = getallinfo.length;
        let ary_commentinfo = [];
        for(let idx=0; idx<arylength; idx++){
          ary_commentinfo[idx] = new Array();
        }
        let count;
        let now_time = new Date();
        let time_sub;
        let written_time = [];
        for(var i=0;i<data4.length;i++){
          written_time[i] =  data4[i].written_time;
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
        for (var b in getallinfo) {
          count = 0;
          for (let c = 0; c < data4.length; c++) {
            if (count !== 2 && getallinfo[b].id === data4[c].post_id) {
              let commentinfo = {
                user_nick: data4[c].user_nick,
                content: data4[c].content,
                image: data4[c].profile,
                level: data4[c].level,
                written_time: written_time[c],
                statemessage: data4[c].statemessage
              };
              ary_commentinfo[b][count] = commentinfo;
              count++;
            };
          }
        }
        for(var d in getallinfo) {
          let allinfo = {
            postinfo: getallinfo[d],
            commentinfo: ary_commentinfo[d]
          };
          ary_allinfo[d] = allinfo;
        }
        res.status(203).send({ result: ary_allinfo, message: 'ok' });
        connection.commit();
      }
      connection.release();
      });
    });
  })
})

// 카테고리별 최신순 보기 100%
router.get('/categorylatest/:user_nick/:category', (req, res) => {
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
      connection.beginTransaction(err => { //트랜잭션 작업을 시작합니다.
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'beginning transaction error: '+err}); connection.release(); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select User.part, User.level, User.nickname, User.profile, User.statemessage, Post.id, Post.title, Post.contents, Post.likecount, Post.commentcount, Post.written_time, Post.image1, Post.image2, Post.image3, Post.image4, Post.image5 from User, Post where User.nickname = Post.user_nick and Post.category = ? order by Post.id desc';
      connection.query(query, req.params.category, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data,connection]) => {
    return new Promise((fulfill, reject) => {
      let query2 = 'select post_id from PostLikeCount where user_nick = ? ';
      connection.query(query2, req.params.user_nick, (err, data2) => {
        if(err) reject([err, connection]);
        else fulfill([data, data2, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query2 err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, data2, connection]) => {
    return new Promise((fulfill, reject) => {
      let likeunlike = [];
      for (var b in data) {
        likeunlike[b] = 0;
        for (var c in data2) {
          if (data[b].id === data2[c].post_id) {
            likeunlike[b] = 1;
          }
        }
      }
      let query3 = 'select post_id from FavoritePost where user_nick = ? ';
      connection.query(query3, req.params.user_nick, (err, data3) => {
        if(err) reject([err, connection]);
        else fulfill([data, likeunlike, data3, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query3 err: " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, likeunlike, data3, connection]) => {
    return new Promise((fulfill, reject) => {
      let markunmark = [];
      let getallinfo = [];
      let ary_image = [];
      let imageInfo = [];
      let imagecount;
      for(let idx=0; idx<data.length; idx++){
        ary_image[idx] = new Array();
      }
      for(let idx=0; idx<data.length; idx++){
        imageInfo[idx] = new Array();
      }
      for (var b in data) {
        markunmark[b] = 0;
        for (var c in data3) {
          if (data[b].id === data3[c].post_id) {
            markunmark[b] = 1;
          }
        }
      }
      for (var c in data) {
        imageInfo[c].push(data[c].image1);
        imageInfo[c].push(data[c].image2);
        imageInfo[c].push(data[c].image3);
        imageInfo[c].push(data[c].image4);
        imageInfo[c].push(data[c].image5);
      }
      for(var d in data){
        imagecount=0;
        for(let f=0 ; f < 5 ; f++ )
        if( imageInfo[d][f] !== null){
          ary_image[d][imagecount]=imageInfo[d][f];
          imagecount++;
        }
      }
      for( var e in data) {
        let info = {
          part: data[e].part,
          level: data[e].level,
          nickname: data[e].nickname,
          profile: data[e].profile,
          statemessage: data[e].statemessage,
          id: data[e].id,
          user_nick: data[e].user_nick,
          title: data[e].title,
          contents: data[e].contents,
          likecount: data[e].likecount,
          commentcount: data[e].commentcount,
          written_time: data[e].written_time,
          likecheck: likeunlike[e],
          markcheck: markunmark[e],
          image: ary_image[e]
        };
        getallinfo.push(info);
      }
      let query4 = 'select Comment.post_id, Comment.user_nick, Comment.content, Comment.written_time, User.profile, User.level, User.statemessage from User, Comment where User.nickname = Comment.user_nick order by Comment.id desc';
      connection.query(query4, getallinfo, function(err, data4) {
        if(err){ res.status(500).send({ result: [], message: ' query4 error : ' + err}); connection.rollback(); }
        else
        {
        ary_allinfo = [];
        let arylength = getallinfo.length;
        let ary_commentinfo = [];
        for(let idx=0; idx<arylength; idx++){
          ary_commentinfo[idx] = new Array();
        }
        let count;
        let now_time = new Date();
        let time_sub;
        let written_time = [];
        for(var i=0;i<data4.length;i++){
          written_time[i] =  data4[i].written_time;
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
        for (var b in getallinfo) {
          count = 0;
          for (let c = 0; c < data4.length; c++) {
            if (count !== 2 && getallinfo[b].id === data4[c].post_id) {
              let commentinfo = {
                user_nick: data4[c].user_nick,
                content: data4[c].content,
                image: data4[c].profile,
                level: data4[c].level,
                written_time: written_time[c],
                statemessage: data4[c].statemessage
              };
              ary_commentinfo[b][count] = commentinfo;
              count++;
            };
          }
        }
        for(var d in getallinfo) {
          let allinfo = {
            postinfo: getallinfo[d],
            commentinfo: ary_commentinfo[d]
          };
          ary_allinfo[d] = allinfo;
        }
        res.status(203).send({ result: ary_allinfo, message: 'ok' });
        connection.commit();
      }
      connection.release();
      });
    });
  })
})

// 카테고리별 인기순 보기 100%
router.get('/categorypopular/:user_nick/:category', (req, res) => {
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
      connection.beginTransaction(err => { //트랜잭션 작업을 시작합니다.
        if(err) reject(err);
        else fulfill(connection);
      });
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'beginning transaction error: '+err}); connection.release(); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select User.part, User.level, User.nickname, User.profile, User.statemessage, Post.id, Post.title, Post.contents, Post.likecount, Post.commentcount, Post.written_time, Post.image1, Post.image2, Post.image3, Post.image4, Post.image5 from User, Post where User.nickname = Post.user_nick and Post.category = ? order by Post.likecount desc';
      connection.query(query, req.params.category, (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data,connection]) => {
    return new Promise((fulfill, reject) => {
      let query2 = 'select post_id from PostLikeCount where user_nick = ? ';
      connection.query(query2, req.params.user_nick, (err, data2) => {
        if(err) reject([err, connection]);
        else fulfill([data, data2, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query2 err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, data2, connection]) => {
    return new Promise((fulfill, reject) => {
      let likeunlike = [];
      for (var b in data) {
        likeunlike[b] = 0;
        for (var c in data2) {
          if (data[b].id === data2[c].post_id) {
            likeunlike[b] = 1;
          }
        }
      }
      let query3 = 'select post_id from FavoritePost where user_nick = ? ';
      connection.query(query3, req.params.user_nick, (err, data3) => {
        if(err) reject([err, connection]);
        else fulfill([data, likeunlike, data3, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "query3 err: " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, likeunlike, data3, connection]) => {
    return new Promise((fulfill, reject) => {
      let markunmark = [];
      let getallinfo = [];
      let ary_image = [];
      let imageInfo = [];
      let imagecount;
      for(let idx=0; idx<data.length; idx++){
        ary_image[idx] = new Array();
      }
      for(let idx=0; idx<data.length; idx++){
        imageInfo[idx] = new Array();
      }
      for (var b in data) {
        markunmark[b] = 0;
        for (var c in data3) {
          if (data[b].id === data3[c].post_id) {
            markunmark[b] = 1;
          }
        }
      }
      for (var c in data) {
        imageInfo[c].push(data[c].image1);
        imageInfo[c].push(data[c].image2);
        imageInfo[c].push(data[c].image3);
        imageInfo[c].push(data[c].image4);
        imageInfo[c].push(data[c].image5);
      }
      for(var d in data){
        imagecount=0;
        for(let f=0 ; f < 5 ; f++ )
        if( imageInfo[d][f] !== null){
          ary_image[d][imagecount]=imageInfo[d][f];
          imagecount++;
        }
      }
      for( var e in data) {
        let info = {
          part: data[e].part,
          level: data[e].level,
          nickname: data[e].nickname,
          profile: data[e].profile,
          statemessage: data[e].statemessage,
          id: data[e].id,
          user_nick: data[e].user_nick,
          title: data[e].title,
          contents: data[e].contents,
          likecount: data[e].likecount,
          commentcount: data[e].commentcount,
          written_time: data[e].written_time,
          likecheck: likeunlike[e],
          markcheck: markunmark[e],
          image: ary_image[e]
        };
        getallinfo.push(info);
      }
      let query4 = 'select Comment.post_id, Comment.user_nick, Comment.content, Comment.written_time, User.profile, User.level, User.statemessage from User, Comment where User.nickname = Comment.user_nick order by Comment.id desc';
      connection.query(query4, getallinfo, function(err, data4) {
        if(err){ res.status(500).send({ result: [], message: ' query4 error : ' + err}); connection.rollback(); }
        else
        {
        ary_allinfo = [];
        let arylength = getallinfo.length;
        let ary_commentinfo = [];
        for(let idx=0; idx<arylength; idx++){
          ary_commentinfo[idx] = new Array();
        }
        let count;
        let now_time = new Date();
        let time_sub;
        let written_time = [];
        for(var i=0;i<data4.length;i++){
          written_time[i] =  data4[i].written_time;
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
        for (var b in getallinfo) {
          count = 0;
          for (let c = 0; c < data4.length; c++) {
            if (count !== 2 && getallinfo[b].id === data4[c].post_id) {
              let commentinfo = {
                user_nick: data4[c].user_nick,
                content: data4[c].content,
                image: data4[c].profile,
                level: data4[c].level,
                written_time: written_time[c],
                statemessage: data4[c].statemessage
              };
              ary_commentinfo[b][count] = commentinfo;
              count++;
            };
          }
        }
        for(var d in getallinfo) {
          let allinfo = {
            postinfo: getallinfo[d],
            commentinfo: ary_commentinfo[d]
          };
          ary_allinfo[d] = allinfo;
        }
        res.status(203).send({ result: ary_allinfo, message: 'ok' });
        connection.commit();
      }
      connection.release();
      });
    });
  })
})

// 좋아요 누를 시
router.get('/postlike/:user_nick/:post_id', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {
    res.status(500).send({ result: [], message: 'getConnection err : ' + err});
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select count(*) as count from PostLikeCount where user_nick =? and post_id = ?';
      connection.query(query, [req.params.user_nick, req.params.post_id], (err, data) => {
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
        connection.release();
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: " count err : " + err});
  })
  .then(([data, connection]) =>{
    if(data[0].count == 0) {
      return new Promise((fulfill, reject) => {
        pool.getConnection((err, connection) => {
          if(err) reject(err);
          else fulfill(connection);
        });
      })
      .catch(err => { res.status(500).send({ result: [], message: "getConnection err : " + err});})
      .then(connection => {
        return new Promise((fulfill, reject) => {
          connection.beginTransaction(err => {
            if(err) reject(err);
            else fulfill(connection);
          });
        });
      })
      .catch(err => {
        res.status(500).send({ result: [], message: 'begin transaction err : ' + err});
        connection.release();
      })
      .then(connection => {
        return new Promise((fulfill, reject) => {
          let query2 = 'insert into PostLikeCount set ?';
          let record = {
            user_nick: req.params.user_nick,
            post_id: req.params.post_id
          };
          connection.query(query2, record, (err, data) => {
            if(err) reject([err, connection]);
            else fulfill([data, connection]);
          })
        });
      })
      .catch(([err, connection]) => {
        res.status(500).send({ result: [], message: 'insert PostLikeCountInfo err : ' + err});
        connection.rollback();
        connection.release();
      })
      .then(([data, connection]) => {
        return new Promise((fulfill, reject) => {
          let query3 = 'update Post set likecount=likecount+1 where id=?';
          connection.query(query3, req.params.post_id, (err, data2) => {
            if(err) reject([err, connection]);
            else fulfill([data2, connection]);
          });
        });
      })
      .catch(([err, connection]) => {
        rse.status(500).send({ result: [], message: 'update likecount err : ' + err});
        connection.rollback();
        connection.release();
      })
      .then(([data2, connection]) => {
        let query4 = 'select likecount from Post where id = ? ';
        connection.query(query4, [req.params.post_id], (err, data) =>{
          if(err){
            res.status(500).send({ result: [], message: ' select likecount err : ' + err });
            connection.rollback();
          }
          else{
              res.status(200).send({ result: data, message: 'like' });
              connection.commit();
          }
          connection.release();
        });
      })
    }
    else{
      return new Promise((fulfill, reject) => {
        pool.getConnection((err, connection) => {
          if(err) reject(err);
          else fulfill(connection);
        });
      })
      .catch(err => { res.status(500).send({ result: [], message: "getConnection err : " + err});})
      .then(connection => {
        return new Promise((fulfill, reject) => {
          connection.beginTransaction(err => {
            if(err) reject(err);
            else fulfill(connection);
          });
        });
      })
      .catch(err => {
        res.status(500).send({ result: [], message: 'begin transaction err : ' + err});
        connection.release();
      })
      .then(connection => {
        return new Promise((fulfill, reject) => {
          let query2 = 'delete from PostLikeCount where user_nick=? and post_id=?';
          connection.query(query2, [req.params.user_nick, req.params.post_id], (err, data) => {
            if(err) reject([err, connection]);
            else fulfill([data, connection]);
          })
        });
      })
      .catch(([err, connection]) => {
        res.status(500).send({ result: [], message: 'insert PostLikeCountInfo err : ' + err});
        connection.rollback();
        connection.release();
      })
      .then(([data, connection]) => {
        return new Promise((fulfill, reject) => {
          let query3 = 'update Post set likecount=likecount-1 where id=?';
          connection.query(query3, req.params.post_id, (err, data2) => {
            if(err) reject([err, connection]);
            else fulfill([data2, connection]);
          });
        });
      })
      .catch(([err, connection]) => {
        rse.status(500).send({ result: [], message: 'update likecount err : ' + err});
        connection.rollback();
        connection.release();
      })
      .then(([data2, connection]) => {
        let query4 = 'select likecount from Post where id = ? ';
        connection.query(query4, [req.params.post_id], (err, data) =>{
          if(err){
            res.status(500).send({ result: [], message: ' select likecount err : ' + err });
            connection.rollback();
          }
          else{
              res.status(200).send({ result: data, message: 'unlike' });
              connection.commit();
          }
          connection.release();
        });
      })
    }
  })
})

//게시글 찜하기 100%
router.get('/bookmark/:user_nick/:post_id', (req, res) => {
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else fulfill(connection);
      });
    })
    .catch(err => {
      res.status(500).send({
        result: [],
        message: 'getConnection error : ' + err
      });
    })
    .then(connection => {
      return new Promise((fulfill, reject) => {
        let usernick = req.params.user_nick;
        let postid = req.params.post_id;
        let query = 'select count(*) as fcount from FavoritePost where user_nick = ? and post_id = ? ';
        connection.query(query, [usernick, postid], (err, data) => {
          if (err) reject([err, connection]);
          else fulfill([data, usernick, postid, connection]);
        });
      });
    })
    .catch(values => {
      res.status(403).send({ message: ' err : ' + values[0] });
      values[1].release();
    })
    .then(values => {
      return new Promise((reject, fulfill) => {
        let usernick = values[1];
        let postid = values[2];
        if (values[0][0].fcount === 0 ) {
          let query2 = 'insert into FavoritePost set ? ';
          let record = {
            user_nick: usernick,
            post_id: postid
          };
          values[3].query(query2, record, function(err, data) {
            if (err) res.status(500).send({ message: 'fail' });
            else res.status(203).send({ message: 'mark' });
            values[3].release();
          });
        } else {
          let query3 = 'delete from FavoritePost where user_nick = ? and post_id = ?';
          values[3].query(query3, [usernick, postid], function(err, data) {
            if (err) res.status(500).send({ message: 'fail' });
            else res.status(203).send({ message: 'unmark' });
            values[3].release();
          });
        }
      });
    });
});

// 검색 돋보기 버튼 눌렀을 시
router.post('/find', (req, res) => {
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else fulfill(connection);
      });
    })
    .catch(err => {
      res.status(500).send({ result: [], message: 'getConnection error : ' + err });
    })
    .then(connection => {
      return new Promise((fulfill, reject) => {
        let query = 'select user_nick, title, id from Post where title LIKE "%"?"%" and part=?';
        connection.query(query, [req.body.search_content, req.body.part], (err, data) => {
          if (err) res.status(500).send({
            result: [],
            message: 'selecting user error: ' + err
          });
          else {
            res.status(200).send({ result: data, message: 'ok' });
          }
          connection.release();
        });
      });
    });
});



module.exports = router;
