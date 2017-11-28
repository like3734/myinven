var express = require('express');
var router = express.Router();
var signin = require('./signin');
var editid = require('./editid');
var editpwd = require('./editpwd');
// var signup = require('./signup');

// router.use('/signup', signup);
router.use('/signin', signin);
router.use('/editid', editid);
router.use('/editpwd', editpwd);

module.exports = router;
