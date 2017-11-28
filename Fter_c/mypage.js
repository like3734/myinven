const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
const bodyParser = require('body-parser');
//const ejs = require('ejs');
const fs = require('fs');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const multer = require('multer');
const multerS3 = require('multer-s3');
//const bcrypt = require('bcrypt');
var userid;
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


// 마이페이지 화면 들어갔을 때 100%
router.get('/:user_nick', (req, res) => {
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
        let query = 'select level, profile, nickname, statemessage, part from User where nickname=?';
        //let query2 = 'select Post.title,Post.written_time,Post.id from User,Post where User.nickname=? and User.nickname=Post.user_nick order by Post.written_time desc';
        connection.query(query, [req.params.user_nick], (err, data) => {
          if (err) res.status(500).send({ message: 'selecting user error: ' + err });
          else {
            console.log(data);
            let lecord = {
              level: data[0].level,
              profile: data[0].profile,
              nickname: data[0].nickname,
              statemessage: data[0].statemessage,
              part: data[0].part
            };
            res.status(200).send({result: lecord, message: 'ok' });
          }
          connection.release();
        });
      });
    });
});

/////////// 내가 찜한 글 에서 다시 내가 쓴 글 눌렀을 때 100%
router.get('/write/:user_nick', (req, res) => {
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
      let query = 'select Post.title,Post.written_time,Post.id from User,Post where User.nickname=? and User.nickname=Post.user_nick order by Post.written_time desc';
      return new Promise((fulfill, reject) => {
        connection.query(query, [req.params.user_nick], (err, data) => {
          if (err) res.status(500).send({
            result: [],
            message: 'selecting user error: ' + err
          });
          else res.status(200).send({
            result: data,
            message: 'ok'
          });
          connection.release();
        });
      });
    })
});

// 마이페이지에서 '내가 찜한 글' 눌렀을 시 100%
router.get('/like/:user_nick', (req, res) => {
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
      let query = 'select Post.title,Post.written_time,Post.id from User,FavoritePost,Post where User.nickname=? and User.nickname=FavoritePost.user_nick and FavoritePost.post_id=Post.id order by Post.id desc';
      return new Promise((fulfill, reject) => {
        connection.query(query, [req.params.user_nick], (err, data) => {
          if (err) res.status(500).send({
            result: [],
            message: 'selecting user error: ' + err
          });
          else res.status(200).send({
            result: data,
            message: 'ok'
          });
          connection.release();
        });
      });
    })
});

// 개인정보 수정 100% 이미지 한장
router.post('/edit', upload.single('image'), function(req, res) {
  pool.getConnection(function(err, connection) {
    if (err) res.status(500).send({ message : " get connection err : " + err});
    else {
      let userNick = req.body.user_nick;
      let query = 'update User set ? where nickname=?'; //query 순서중요. record 객체 아래에 query하면 imageurl 재대로 안넘어감
      console.log(req.file);
      if(req.file == null){
        var record = {
          nickname: req.body.nickname,
          part: req.body.part,
          statemessage: req.body.statemessage
        };
      }
      else{
        var record = {
          nickname: req.body.nickname,
          part: req.body.part,
          statemessage: req.body.statemessage,
          profile: req.file ? req.file.location : null
        };
      }
      console.log(record);
      connection.query(query, [record, userNick], function(err) {
        if (err) res.status(500).send({ message: 'insert err : ' + err});
        else res.status(201).send({
          message: 'update'
        });
        connection.release();
      });
    }
  });
});


//닉네임 중복 검사
router.post('/nickcheck', function(req, res) {
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else fulfill(connection);
      })
    })
    .catch(err => {
      res.status(500).send({ result: [], message: 'getConnection error :' + err});
    })
    .then((connection) => {
      return new Promise((fulfill, reject) => {
        let query = 'select count(*) as nickcheck from User where nickname = ? ';
        connection.query(query, req.body.newnick, function(err, data) {
          if (err) reject([err, connection]);
          else fulfill([data, connection]);
          connection.release();
        });
      });
    })
    .catch(values => {
      res.status(500).send({ message: "selecting query error: " + values[0] });
    })
    .then(values => {
      if ( req.body.oldnick == req.body.newnick || values[0][0].nickcheck === 0) {// 검색결과 x
        res.status(201).send({ message: 'true' });
      }
      else {
        res.status(201).send({ message: 'false' });
      }
    });
})

module.exports = router;
