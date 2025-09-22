module.exports = app => {
    const controller = require("../../controllers/tv_app/ambulances.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postRmtHosAmbulanceDetail", controller.postRmtHosAmbulanceDetail);
    router.post("/postEkgAmbulanceDetail", controller.postEkgAmbulanceDetail);
    router.post("/postErAmbulanceDetail", controller.postErAmbulanceDetail);
    router.post("/postCccAmbulanceDetail", controller.postCccAmbulanceDetail);
    router.post("/postAocTvAmbulanceDetail", controller.postAocTvAmbulanceDetail);
    router.post("/postAocTvOneOneTwoAmbulanceDetail", controller.postAocTvOneOneTwoAmbulanceDetail);
    router.post("/postAmbulanceCrashDetail", controller.postAmbulanceCrashDetail);
    
    app.use('/api/tvapp/ambulances', (req, res, next) => {
        next(); 
    },router);
  };