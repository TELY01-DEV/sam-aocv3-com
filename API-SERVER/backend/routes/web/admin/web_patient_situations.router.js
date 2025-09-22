module.exports = app => {
    const users = require("../../../controllers/web/admin/web_patient_situations.controller");
  
    var router = require("express").Router();
  
    router.post("/getPatientSituationsList", users.getPatientSituationsList);
    router.post("/updatePatientSitutation", users.updatePatientSitutation);

    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };