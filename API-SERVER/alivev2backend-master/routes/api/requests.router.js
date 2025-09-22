module.exports = app => {
    const validater = require("./validations/requests.validater");
    const controller = require("../../controllers/api/requests.controller");
    var router = require("express").Router();
  
    router.post("/postOngoingAliveUserReq", controller.postOngoingAliveUserReq);
    router.post("/postAocZonesGeofenceList", controller.postAocZonesGeofenceList);
    router.post("/postAliveUserCreateRequest", validater.validate('postAliveUserCreateRequest'), controller.postAliveUserCreateRequest);
    router.post("/postAliveUserCancelRequest", validater.validate('postAliveUserCancelRequest'), controller.postAliveUserCancelRequest);
    router.post("/postAliveUserGetRequestStatus", validater.validate('postAliveUserGetRequestStatus'), controller.postAliveUserGetRequestStatus);

  
    app.use('/api/requests/', (req, res, next) => {
        next(); 
    },router);
  };