var express = require('express');
var router = express.Router();
var list = require('./list');
var register = require('./register');
var edit = require('./edit');
var cut = require('./cut');
var search = require('./search');

router.use('/register', register);
router.use('/list', list);
router.use('/edit', edit);
router.use('/cut', cut);
router.use('/search', search);

module.exports = router;
