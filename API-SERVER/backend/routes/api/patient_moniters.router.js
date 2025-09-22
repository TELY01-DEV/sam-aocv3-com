module.exports = app => {
    const controller = require("../../controllers/api/patient_moniters.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postPatientMoniterOnlineChange", controller.postPatientMoniterOnlineChange);
    
    app.use('/api/patientMoniters', (req, res, next) => {
        next(); 
    },router);

  };