module.exports = (app) => {
  const users = require("../../../controllers/web/admin/web_ambulance_management.controller.js");

  var router = require("express").Router();

  router.post(
    "/getAmbulanceEquipmentCatalogyList",
    users.getAmbulanceEquipmentCatalogyList
  );
  router.post("/getAmbulanceEquipmentList", users.getAmbulanceEquipmentList);
  router.post(
    "/getAmbulanceMaintenanceList",
    users.getAmbulanceMaintenanceList
  );
  router.post("/getAmbulanceTypeList", users.getAmbulanceTypeList);
  router.post("/updateAmbulanceEquipment", users.updateAmbulanceEquipment);
  router.post("/getHospitalAmbulanceList", users.getHospitalAmbulanceList);
  router.post(
    "/getlAmbulanceTrackingHistoriesReport",
    users.getlAmbulanceTrackingHistoriesReport
  );
  router.post(
    "/getlAmbulanceImageHistoriesReport",
    users.getlAmbulanceImageHistoriesReport
  );
  router.post("/updateAmbulanceTypeDetail", users.updateAmbulanceTypeDetail);
  router.post(
    "/updateAmbulanceEquipmentCatalogy",
    users.updateAmbulanceEquipmentCatalogy
  );
  router.post(
    "/updateAmbulanceServiceMaintenance",
    users.updateAmbulanceServiceMaintenance
  );
  router.post("/deleteAmbulanceType", users.deleteAmbulanceType);

  app.use(
    "/api/master",
    (req, res, next) => {
      next();
    },
    router
  );
};
