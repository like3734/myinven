//52.78.124.103:3412/login
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

//메인화면가기 위해서 유저멤버쉽 가입여부 정보 반환
router.get('/', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(501).send({
            msg : "Connection error"
          });
          callback("getConnecntion error at login: " + err, null);
        }
				else callback(null, connection);
			});
		},
    //2. header의 token 값으로 user_email 받아옴.
    function(connection, callback){
      let token = req.headers.token;
      jwt.verify(token, req.app.get('jwt-secret'), function(err, decoded){
        if(err){
          res.status(501).send({
            msg : "user authorization error"
          });
          connection.release();
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getUserCategoryQuery = "select users_category from users where users_email = ?";
      connection.query(getUserCategoryQuery, userEmail, function(err, userCategory){
        if(err){
          res.status(501).send({
            msg : "Get user data error"
          });
          connection.release();
          callback("get userCategory query err : "+err);
        }
        else{
            let categoryString = userCategory[0].users_category;
            let category = JSON.parse(categoryString);
            let check = 1;
            if((category.category[0]==0) && (category.category[1]==0) && (category.category[2]==0) && (category.category[3]==0)){
                check = 0;
            }
            res.status(200).send({
            message : "success",
            data : {
                check : check,
                category : category.category
            }
          });
          connection.release();
          callback(null, "succesful find user category");
        }
      });
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err){
      err = moment().format('MM/DDahh:mm:ss//') + err;
      console.log(err);
    }
    else{
      result = moment().format('MM/DDahh:mm:ss//') + result;
      console.log(result);
    }
  });
});

module.exports = router;
