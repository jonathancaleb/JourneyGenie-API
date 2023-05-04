const express = require('express');
const router = express.Router();

const {
    getWalletBalance,
    getWalletData,
    topUpWallet,
} = require('../controllers/wallet.controller');

const { basicAuth } = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');

router.use(basicAuth(), rbac('enduser rider superadmin'));

router
    .get('/', getWalletData)
    .get('/balance', getWalletBalance)
    .post('/topup', rbac('enduser'), topUpWallet)

module.exports = router;
