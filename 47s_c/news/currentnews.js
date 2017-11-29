const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const jwt = require('jsonwebtoken');


router.get('/politics', function(req, res){
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
        var today = new Date();
        today = moment(today).format('YYYYMMDD');
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 1 and news_date = ? order by news_rank asc';
        connection.query(query, today, (err, data) => {
            if(err){
                res.status(500).send({ result: [], message: "select query error :" + err});
            }
            else{
                res.status(200).send({ result: data, message: "success"});
            }
            connection.release();
        });
    })
});

router.get('/economies', function(req, res){
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
        var today = new Date();
        today = moment(today).format('YYYYMMDD');
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 2 and news_date = ? order by news_rank asc';
        connection.query(query, today, (err, data) => {
            if(err){
                res.status(500).send({ result: [], message: "select query error :" + err});
            }
            else{
                res.status(200).send({ result: data, message: "success"});
            }
            connection.release();
        });
    })
});

router.get('/societies', function(req, res){
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
        var today = new Date();
        today = moment(today).format('YYYYMMDD');
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 3 and news_date = ? order by news_rank asc';
        connection.query(query, today, (err, data) => {
            if(err){
                res.status(500).send({ result: [], message: "select query error :" + err});
            }
            else{
                res.status(200).send({ result: data, message: "success"});
            }
            connection.release();
        });
    })
});

router.get('/sciences', function(req, res){
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
        var today = new Date();
        today = moment(today).format('YYYYMMDD');
        let query = 'select news_id, news_title, news_image, news_date, news_contents from news where news_category = 4 and news_date = ? order by news_rank asc';
        connection.query(query, today, (err, data) => {
            if(err){
                res.status(500).send({ result: [], message: "select query error :" + err});
            }
            else{
                res.status(200).send({ result: data, message: "success"});
            }
            connection.release();
        });
    })
});


router.get('/link/:news_id', function(req, res){
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
        let query = 'select news_url from news where news_id = ?';
        connection.query(query, req.params.news_id, (err,data)=>{
            if(err){ res.status(500).send({ result: [], message: "select query err : " + err});}
            else{
                res.status(200).send({ result: data[0].news_url , message: "success"});
            }
            connection.release();
        })
    })
});

module.exports = router;
