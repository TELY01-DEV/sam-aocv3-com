module.exports = app => {
    const controller = require("../../../controllers/web/admin/web_device_ip.controller");

    var router = require("express").Router();
  
    // router.post("/getDeviceTypeList", controller.getDeviceTypeList);
    // router.post("/postDevicesTypesList", controller.postDevicesTypesList);
    // router.post("/updateDeviceTypeDetail", controller.updateDeviceTypeDetail);

    app.use('/api/devices', (req, res, next) => {
      next(); 
    },router);
  };