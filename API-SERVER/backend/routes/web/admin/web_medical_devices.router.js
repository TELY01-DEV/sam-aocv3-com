module.exports = (app) => {
  const web_medical_devices = require("../../../controllers/web/admin/web_medical_devices.controller");

  var router = require("express").Router();

  router.post(
    "/getMedicalDeviceTypeList",
    web_medical_devices.getMedicalDeviceTypeList
  );
  router.post(
    "/getMedicalDeviceList",
    web_medical_devices.getMedicalDeviceList
  );
  router.post(
    "/updateHospitalDeviceDetail",
    web_medical_devices.updateHospitalDeviceDetail
  );
  router.post(
    "/getMedicalDeviceIpList",
    web_medical_devices.getIpServerDevicesList
  );

  router.post(
    "/updateIpServerDeviceDetail",
    web_medical_devices.updateIpServerDeviceDetail
  );
  router.delete(
    "/deleteIpServerDevice",
    web_medical_devices.deleteIpServerDevice
  );

  app.use(
    "/api/master",
    (req, res, next) => {
      next();
    },
    router
  );
};
