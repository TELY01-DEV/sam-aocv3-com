module.exports = app => {
    const controller = require("../../controllers/api/ambulance.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postHospitalAmbulanceList", controller.postHospitalAmbulanceList);
    router.post("/postAmbulanceDetail", controller.postAmbulanceDetail);
    
    app.use('/api/ambulances', (req, res, next) => {
        next(); 
    },router);
  };