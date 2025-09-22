module.exports = app => {
    const controller = require("../../../controllers/web/user/ambulance_crash_reports.controller");
    var router = require("express").Router();
  
    router.post("/postAmbulanceCrashReport", controller.postAmbulanceCrashReport);
    router.post("/postAmbulanceCrashDetail", controller.postAmbulanceCrashDetail);
    router.post("/postConfirmAmbulanceCrash", controller.postConfirmAmbulanceCrash);
  
    app.use('/api/report', (req, res, next) => {
        next(); 
    },router);
  };