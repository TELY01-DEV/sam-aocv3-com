module.exports = app => {
    const controller = require("../../controllers/api/hospitals.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postZoneAllHospitalsList", controller.postZoneAllHospitalsList);
    
    app.use('/api/hospitals', (req, res, next) => {
        next(); 
    },router);
  };