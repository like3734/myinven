//52.78.124.103:3412/login
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const saltRounds = 10;

router.post('/', function(req, res) {
    let task_array = [
        //1. connection설정
        function(callback) {
            pool.getConnection(function(err, connection) {
                if (err) callback("getConnecntion error at login: " + err, null);
                else callback(null, connection);
            });
        },
        //2. 입력된 email을 DB에서 찾음
        function(connection, callback) {
            let getMailPwdQuery = 'select users_email, users_nickname, users_uid from users where users_email=?';
            connection.query(getMailPwdQuery, req.body.email, function(err, userdata) {
                if (err) {
                    res.status(501).send({
                        msg: "find user data err"
                    });
                    connection.release();
                    callback("1st query err at login : " + err, null);
                } else callback(null, userdata, connection);
            });
        },
        //3. 입력된 email이 없을시 이메일이 없다고함, 비밀번호 틀릴시 비밀번호 틀렸다고함
        function(userdata, connection, callback) {
            let email = req.body.email;
            if (userdata.length === 0) {
                let insertUserQuery = 'insert into users values(?,?,?,?,?,?)';
				let categoryJSON = {
					category : [0,0,0,0]
				};
				let weekTimeJSON = {
					weekTime : [0,0,0,0,0,0,0]
				};
				let category = JSON.stringify(categoryJSON);
				let monthTime = JSON.stringify(monthTimeJSON);

                connection.query(insertUserQuery, [email, req.body.nickname, req.body.uid, category, weekTime, 0], function(err) {
                    if (err) {
                        res.status(501).send({
                            msg: "insert user data error"
                        });
                        connection.release();
                        callback("insert error : " + err, null);
                    } else callback(null, email, req.body.name, connection);
                });
            } else {
                callback(null, userdata[0].users_email, userdata[0].user_nickname, connection);
            }
        },
        function(userEmail, userNickName, connection, callback) {
            const secret = req.app.get('jwt-secret');
            let option = {
                algorithm: 'HS256',
                expiresIn: 3600 * 24 * 10 // 토큰의 유효기간이 10일
            };
            let payload = {
                user_email: userEmail
            };
            let token = jwt.sign(payload, req.app.get('jwt-secret'), option);
            res.status(201).send({
                message: "success",
                nickname: userNickName,
                token: token
            });
            connection.release();
            callback(null, "##### Successful SNS login : " + userEmail);
        }
    ];
    async.waterfall(task_array, function(err, result) {
        if (err) {
            err = moment().format('MM/DDahh:mm:ss//') + err;
            console.log(err);
        } else {
            result = moment().format('MM/DDahh:mm:ss//') + result;
            console.log(result);
        }
    });
});

module.exports = router;
