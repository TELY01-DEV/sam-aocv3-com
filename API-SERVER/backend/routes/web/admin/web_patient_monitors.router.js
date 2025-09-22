module.exports = app => {
    const users = require("../../../controllers/web/admin/web_patient_monitors.controller");
  
    var router = require("express").Router();
  
    router.post("/getPatientMonitorsList", users.getPatientMonitorsList);
    router.post("/updatePatientMonitor", users.updatePatientMonitor);

    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };