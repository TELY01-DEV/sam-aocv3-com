module.exports = (app) => {
  const users = require("../../../controllers/web/admin/web_medical_equipments.controller");

  var router = require("express").Router();
  router.post("/updateMedicalEquDetail", users.updateMedicalEquDetail);
  router.post("/getMedicalEquipmentsList", users.getMedicalEquipmentsList);

  app.use(
    "/api/master",
    (req, res, next) => {
      next();
    },
    router
  );
};
