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

// 게시글 작성 화면 100%
router.get('/write/:user_nick', (req, res) => {
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
        let query = 'select User.profile,User.level,User.nickname,User.part from User where User.nickname=?';
        connection.query(query, [req.params.user_nick], (err, data) => {
          if (err) res.status(500).send({ result: [], message: 'selecting user error: ' + err });
          else res.status(200).send({
            result: data,
            message: 'ok'
          });
          connection.release();
        });
      });
    })
});

// 글 작성한 뒤 '게시하기'눌렀을 시
router.post('/add', upload.array('image', 5), (req, res) => {
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
        let query = 'insert into Post set ?';
        //console.log(req.files);
        let record = {
          category: req.body.category,
          part: req.body.part,
          title: req.body.title,
          contents: req.body.contents,
          image1: req.files[0] ? req.files[0].location : null,
          image2: req.files[1] ? req.files[1].location : null,
          image3: req.files[2] ? req.files[2].location : null,
          image4: req.files[3] ? req.files[3].location : null,
          image5: req.files[4] ? req.files[4].location : null,
          user_nick: req.body.user_nick,
          written_time: moment(new Date()).format('YYYY-MM-DD')
        };
        console.log(record);
        connection.query(query, record, (err, data) => {
          if (err) res.status(500).send({ message: 'selecting user error: ' + err  });
          else res.status(200).send({ message: 'ok' });
          connection.release();
        });
      });
    })
});




// 게시글 자세히 보기
router.post('/read', (req, res) => {
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
      console.log(req.body.user_nick);
      console.log(req.body.post_id);
      let query = ' select User.nickname, User.level, User.part as userpart , User.profile, User.statemessage, Post.title, Post.contents, Post.written_time, Post.part as postpart, Post.category, Post.image1, Post.image2, Post.image3, Post.image4, Post.image5, Post.likecount, Post.commentcount from User, Post where User.nickname = Post.user_nick and Post.id = ? ';
      connection.query(query, req.body.post_id, (err, data) =>{
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "select info : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, connection]) => {
    return new Promise((fulfill, reject) => {
      let query2 = 'select post_id from PostLikeCount where user_nick = ?' ;
      connection.query(query2, req.body.user_nick, (err, data2) => {
        if(err) reject([err, connection]);
        else fulfill([data, data2, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "select PostLikeCount err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, data2, connection]) => {
    return new Promise((fulfill, reject) => {
      let likecheck = 0;
      for(let a=0; a < data2.length ; a++){
        let id = data2[a].post_id;
        if(req.body.post_id == data2[a].post_id){
          likecheck = 1;
        }
      }
      let query3 = 'select post_id from FavoritePost where user_nick = ?';
      connection.query(query3, req.body.user_nick, (err, data3) => {
        if(err) reject([err, connection]);
        else fulfill([data, likecheck, data3, connection]);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "select FavoritePost err : " + err});
    connection.rollback();
    connection.release();
  })
  .then(([data, likecheck, data3, connection]) => {
    return new Promise((fulfill, reject) => {
      let ary_image = [];
      let imageInfo = [];
      let markcheck = 0;
      for(let a=0; a< data3.length ; a++){
        let id = data3[a].post_id;
        if(req.body.post_id == data3[a].post_id){
          markcheck = 1;
        }
      }
      imageInfo.push(data[0].image1);
      imageInfo.push(data[0].image2);
      imageInfo.push(data[0].image3);
      imageInfo.push(data[0].image4);
      imageInfo.push(data[0].image5);
      for(var d=0; d < 5; d++){
        if( imageInfo[d] !== null){
          ary_image.push(imageInfo[d]);
        }
      }

      let postinfo = {
        nickname: data[0].nickname,
        level: data[0].level,
        userpart: data[0].userpart,
        profile: data[0].profile,
        statemessage: data[0].statemessage,
        title: data[0].title,
        contents: data[0].contents,
        written_time: data[0].written_time,
        postpart: data[0].postpart,
        category: data[0].category,
        likecount: data[0].likecount,
        commentcount: data[0].commentcount,
        likecheck: likecheck,
        markcheck: markcheck,
        image: ary_image
      };
      let query4 = 'select Comment.user_nick, Comment.content, User.profile, Comment.written_time, User.level, User.part, User.statemessage from Comment, User where Comment.post_id = ? and Comment.user_nick = User.nickname order by Comment.id desc';
      connection.query(query4, req.body.post_id, (err, data4) => {
        if(err){
          res.status(500).send({ result: [], message: "select commentinfo err : " + err});
          connection.rollback();
        }
        else{
          let count=0;
          let ary_commentinfo = [];
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
          for (let c = 0; c < data4.length; c++) {
            if(count < 2){
              let commentinfo = {
                user_nick: data4[c].user_nick,
                content: data4[c].content,
                image: data4[c].profile,
                level: data4[c].level,
                part: data4[c].part,
                written_time: written_time[c],
                statemessage: data4[c].statemessage
              };
              ary_commentinfo.push(commentinfo);
              count++;
              console.log(count);
            }
          }
          console.log(ary_commentinfo[0]);
          let ary_all = { postinpo: postinfo, commentinfo: ary_commentinfo };
          res.status(200).send({
            result: ary_all,
            message: 'success'
          });
          connection.commit();
        }
        connection.release();
      });
    });
  })
})

//게시글 삭제 100%
router.post('/delete', (req, res) => {
  return new Promise((fulfill, reject) => {
      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else fulfill(connection);
      });
    })
    .catch(err => {
      res.status(500).send({ message: 'getConnection error : ' + err });
    })
    .then(connection => {
      return new Promise((fulfill, reject) => {
        let postid = req.body.post_id;
        let usernick = req.body.user_nick;
        let query = 'delete from Post where id = ? and user_nick = ? ';
        connection.query(query, [postid, usernick], (err, data) => {
          if (err) res.status(500).send({ message: ' query error : ' + err });
          else {
            res.status(203).send({ message: 'success'});
          }
          connection.release();
        });
      });
    });
});

// 게시글 삭제 유효성 검사
router.post('/deletecheck', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {
    res.status(500).send({ message: 'getConnection err : ' + err});
  })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let postid = req.body.post_id;
      let usernick = req.body.user_nick;
      let query = 'select count(*) as checking from Post where id = ? and user_nick = ? ';
      connection.query(query, [postid, usernick], (err, data) =>{
        if(err) reject([err, connection]);
        else fulfill([data, connection]);
        //connection.release();
      });
    })
    .catch(values => {
      res.status(500).send({ message: ' select error : ' + values[0] });
      values[1].release();
    })
    .then(values =>{
      if(values[0][0].checking === 0){
        res.status(203).send({ message: 'deny' });
      }
      else{
          res.status(203).send({ message: 'ok'});
      }
      values[1].release();
    });
  });
})

module.exports = router;
