const express = require('express');
const router = express.Router();

const {
    goOnline,
    goOffline
} = require('../controllers/rider.controller')

const { basicAuth } = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

router.use(basicAuth());

router
    .post('/online', permit('rider'), goOnline)
    .post('/offline', permit('rider'), goOffline)

module.exports = router;


