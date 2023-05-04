const express = require('express');
const router = express.Router();

const {
    addNewCard,
    removeCard,
    getCardData,
    getCards,
} = require('../controllers/card.controller');

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('enduser superadmin'));

router
    .post('/add', addNewCard)
    .get('/get/:id', getCardData)
    .get('/get-all', getCards)
    .delete('/remove/:id', removeCard);

module.exports = router;
