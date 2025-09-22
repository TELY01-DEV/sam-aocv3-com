module.exports = app => {
    const controller = require("../../../controllers/web/admin/web_user_devices.controller");

    var router = require("express").Router();
  
    router.post("/getDeviceList", controller.getDeviceList);
    router.post("/updateDeviceDetail", controller.updateDeviceDetail);
    router.post("/deviceLists", controller.deviceLists);

    app.use('/api/devices', (req, res, next) => {
      next(); 
    },router);
  };