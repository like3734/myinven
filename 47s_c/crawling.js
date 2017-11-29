const express = require('express');
const aws = require('aws-sdk');
const router = express.Router();
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('./config/db_pool');
const moment = require('moment');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('binary');
var iconv = require('iconv-lite');
const fs = require('fs');
const saltRounds = 10;


  //uri: "http://news.naver.com/main/ranking/read.nhn?mid=etc&sid1=111&rankingType=popular_day&oid=001&aid=0009441792&date=20170729&type=1&rankingSectionId=101&rankingSeq=1",

var requestOptions = {
  method: "POST",
  uri: "http://news.naver.com/main/ranking/popularDay.nhn?rankingType=popular_day&sectionId=101&date=20170730",
  encoding: 'utf-8'
};

var url = "http://news.naver.com/main/ranking/popularDay.nhn?rankingType=popular_day&sectionId=101&date=20170730";
//var url = "https://www.indeed.com/cmp/Fuze-Lab/jobs/Entry-Junior-PHP-Jquery-MySQL-Coder-Team-Member-01790db21236725e";
request(url, function(err, res, body) {
      var sms = iconv.decode(new Buffer(body), 'utf-8');
      var $ = cheerio.load(sms);
      var image = $('.num1').children('dl').children('dt').children('a');
      var href = $(image).attr('href');
      console.log(href);
      var text = $(image).attr('title');
      //var imgUrl = image.text(;
      console.log(text);
});

module.exports = router;
