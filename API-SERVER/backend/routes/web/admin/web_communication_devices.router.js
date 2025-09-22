module.exports = app => {
  const web_communication_devices = require("../../../controllers/web/admin/web_communication_devices.controller");

  var router = require("express").Router();

  router.post("/getCommunicationDeviceTypeList", web_communication_devices.getCommunicationDeviceTypeList);
  router.post("/getCommunicationDeviceList", web_communication_devices.getCommunicationDeviceList);
  router.post("/getStreamServersList", web_communication_devices.getStreamServersList);
  router.post("/getAmbulanceCommunicationDeviceList", web_communication_devices.getAmbulanceCommunicationDeviceList);
  
  router.post("/updateCommunicationDevices", web_communication_devices.updateCommunicationDevices);
  router.post("/updateCommunicationDeviceType", web_communication_devices.updateCommunicationDeviceType);
  router.post("/updateStreamServers", web_communication_devices.updateStreamServers);
  router.post("/updateAmbulanceCommunicationDevice", web_communication_devices.updateAmbulanceCommunicationDevice);
  router.post("/getAmbulanceFromHospital", web_communication_devices.getAmbulanceFromHospital);

  

  app.use('/api/communication', (req, res, next) => {
    next(); 
  },router);
};