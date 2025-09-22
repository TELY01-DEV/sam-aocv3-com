module.exports = app => {
    const controller = require("../controllers/tracking.controller");
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/postAmbulanceTracking", controller.postAmbulanceTracking);
  
    app.use('/api/tracking', (req, res, next) => {
        next(); 
    },router);
  };