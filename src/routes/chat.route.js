const express = require('express');
const router = express.Router();

const {
    initChatWithRider, 
} = require('../controllers/chat.controller');

const { basicAuth } = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

router.use(basicAuth());

router
    .post('/init', permit('enduser superadmin'), initChatWithRider)

module.exports = router;