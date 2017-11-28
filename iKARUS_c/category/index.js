var express = require('express');
var router = express.Router();
var add = require('./add');
var cut = require('./cut');
var main = require('./main');
var edit = require('./edit');

router.use('/edit', edit);
router.use('/add', add);
router.use('/cut', cut);
router.use('/main', main);

module.exports = router;
