module.exports = app => {
    const controller = require("../../../controllers/web/user/web_user_aoc_requests.controller");

    var router = require("express").Router();

    router.post("/postAocRequestStatusChange", controller.postAocRequestStatusChange);
    router.post("/getZoneHospitalsList", controller.getZoneHospitalsList);
    router.post("/postAliveRequestDetail", controller.postAliveRequestDetail);
    router.post("/postAocRequestDetailUpdate", controller.postAocRequestDetailUpdate);
    
    app.use('/api/userAocRequest', (req, res, next) => {
      next(); 
    },router);

}