const express = require('express');
const router = express.Router();

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

const {
    addUserAccount,
    getUserAccountData,
    updateUserAccount,
    deactivateUserAccount,
    activateUserAccount,
} = require('../controllers/user.controller');
const { User } = require('../models/users.model');

// router.use(basicAuth(), rbacMiddleware('superadmin'));

router
    .post('/add', addUserAccount)
    .get('/data/:email', getUserAccountData)
    .put('/update', updateUserAccount)
    .put('/deactivate/:email', deactivateUserAccount)
    .put('/activate/:email', activateUserAccount)
    .get('/user-data', async (req, res) => {
        const user = await User.findOne({ email: req.query.target_email }).populate('status');
        console.log(user)

        return res.status(200).json({
            success: true,
            data: { user }
        })
    })

module.exports = router;
