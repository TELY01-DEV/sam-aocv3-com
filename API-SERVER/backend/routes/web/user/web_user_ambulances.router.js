module.exports = app => {
    const controller = require("../../../controllers/web/user/web_user_ambulances.controller");

    var router = require("express").Router();

    router.post("/getHospitalOngoingAmbulanceList", controller.getHospitalOngoingAmbulanceList);
    router.post("/getUserAmbulanceList", controller.getUserAmbulanceList);
    router.post("/getHospitalsList", controller.getHospitalsList);
    router.post("/getAllAocZonesList", controller.getAllAocZonesList);
    
    router.post("/getAmbulanceSnapShotsDetail", controller.getAmbulanceSnapShotsDetail);
    router.post("/getAmbulanceTrackingDetail", controller.getAmbulanceTrackingDetail);
    router.post("/getAmbulanceEcgDetail", controller.getAmbulanceEcgDetail);
    router.post("/getAmbulanceSnapTrackEcgDetail", controller.getAmbulanceSnapTrackEcgDetail);
    
    app.use('/api/userAmbulance', (req, res, next) => {
      next(); 
    },router);

}