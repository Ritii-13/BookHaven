const express = require('express')
const router = express.Router()
const browse = require('../controller/browse')

router.route('/browse')
    .get(browse.renderBrowseBooks)
    