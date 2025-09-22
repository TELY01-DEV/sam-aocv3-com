module.exports = app => {
    const controller = require("../../controllers/notifications/notifications.controller");
    var router = require("express").Router();
  
    router.post("/postAmbulanceSpeedNotification", controller.postAmbulanceSpeedNotification);
    router.post("/postCreateReqNotification", controller.postCreateReqNotification);

    app.use('/api/notification', (req, res, next) => {
        next(); 
    },router);
  };