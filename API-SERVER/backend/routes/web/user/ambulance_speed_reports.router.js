module.exports = app => {
    const controller = require("../../../controllers/web/user/ambulance_speed_reports.controller");
    var router = require("express").Router();
  
    router.post("/postAmbulanceSpeedReport", controller.postAmbulanceSpeedReport);
    router.post("/postAmbulanceSpeedReportDetail", controller.postAmbulanceSpeedReportDetail);
    router.post("/getAllAocZonesList", controller.getAllAocZonesList);
    router.post("/getZoneHospitalsList", controller.getZoneHospitalsList);
    router.post("/getHospitalAmbulancesList", controller.getHospitalAmbulancesList);

    app.use('/api/report', (req, res, next) => {
        next(); 
    },router);
  };