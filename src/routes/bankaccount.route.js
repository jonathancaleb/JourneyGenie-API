const express = require('express');
const router = express.Router();

const {
    addNewBankAccount,
    removeBankAccount,
    getBankAccounts,
    getBankAccountData,
    createVAforRider
} = require('../controllers/bankaccount.controller');

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('rider superadmin'));

router
    .post('/add', addNewBankAccount)
    .get(
        '/get/:id',
        rbacMiddleware('enduser rider admin superadmin'),
        getBankAccountData
    )
    .get('/get-all', getBankAccounts)
    .delete('/remove/:id', removeBankAccount)
    .post('/virtual/create', createVAforRider)

module.exports = router;
