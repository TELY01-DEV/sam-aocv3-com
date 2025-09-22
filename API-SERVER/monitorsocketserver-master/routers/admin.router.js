const adminController = require("../controllers/admin.controller.js");
var router = require("express").Router();

router.get('/', adminController.login);
router.post('/loginapi', adminController.loginapi);
router.get('/logout', adminController.authCheck, adminController.logout);

router.get('/dashboard', adminController.authCheck, adminController.dashboard);
router.post('/dashboardData', adminController.dashboardData);

router.get('/patients', adminController.authCheck, adminController.patients);
router.post('/editPatient', adminController.editPatient);
router.post('/updatePatient', adminController.updatePatient);
router.post('/patientData', adminController.patientData);
router.post('/freeDevice', adminController.freeDevice);

router.get('/devices', adminController.authCheck, adminController.devices);
router.post('/deleteDevice', adminController.deleteDevice);
router.post('/updateDevice', adminController.updateDevice);
router.post('/deviceData', adminController.deviceData);
router.post('/freedeviceData', adminController.freedeviceData);

module.exports = router;