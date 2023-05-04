const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multerobject');

const {
    addVehicle,
    getVehicleData,
    updateVehicleData,
    removeVehicle,
    getRidersVehicles,
    activateVehicle,
    deactivateVehicle,
} = require('../controllers/vehicle.controller');
const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('rider'));

router
    .post('/add', upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'banner', maxCount: 1 }
    ]), addVehicle)    
    .get(
        '/get/:id',
        rbacMiddleware('enduser rider admin superadmin'),
        getVehicleData
    )
    .put('/update/:id', updateVehicleData)
    .get('/riders-vehicles', getRidersVehicles)
    .delete('/remove/:id', removeVehicle)
    .put('/activate/:id', rbacMiddleware('admin superadmin rider'), activateVehicle)
    .put(
        '/deactivate/:id',
        rbacMiddleware('admin superadmin rider'),
        deactivateVehicle
    );

module.exports = router;
