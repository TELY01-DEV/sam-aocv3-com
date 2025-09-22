module.exports = app => {
    const controller = require("../../../controllers/web/social/ambulances.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/getAmbulanceSnapTrackEcgDetail", controller.getAmbulanceSnapTrackEcgDetail);
    
    app.use('/api/social', (req, res, next) => {
        next(); 
    },router);
  };