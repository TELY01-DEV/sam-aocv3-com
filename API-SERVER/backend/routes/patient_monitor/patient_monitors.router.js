module.exports = app => {
    const controller = require("../../controllers/patient_monitor/patient_monitors.controller");
    const validater = require("./validations/patient_monitors.validater");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postPatientMonitorsDetail", validater.validate('postPatientMonitorsDetail'), controller.postPatientMonitorsDetail);
    router.post("/postPatientMonitorsRegister", controller.postPatientMonitorsRegister);
    router.post("/postPatientMonitorsStatusChange", controller.postPatientMonitorsStatusChange);
    router.get("/getPatientMonitorsList", controller.getPatientMonitorsList);

    
    app.use('/api/patientMonitors', (req, res, next) => {
        next(); 
    },router);

}