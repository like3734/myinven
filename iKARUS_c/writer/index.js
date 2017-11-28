var express = require('express');
var router = express.Router();

var list = require('./list');
var register = require('./register');
var cut = require('./cut');
var edit = require('./edit');

router.use('/list', list);
router.use('/register', register);
router.use('/cut', cut);
router.use('/edit', edit);

module.exports = router;
