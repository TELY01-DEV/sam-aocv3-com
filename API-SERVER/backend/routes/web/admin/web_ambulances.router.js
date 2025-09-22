module.exports = app => {
    const web_ambulances = require("../../../controllers/web/admin/web_ambulances.controller");
  
    var router = require("express").Router();
  
    router.post("/getAmbulanceList", web_ambulances.getAmbulanceList);
    router.post("/getAmbulanceUsageMaintenanceList", web_ambulances.getAmbulanceUsageMaintenanceList);

    router.post("/getAllAmbulanceTypesList", web_ambulances.getAllAmbulanceTypesList);
    router.post("/getAllAocZonesList", web_ambulances.getAllAocZonesList);
    router.post("/getAllMedicalEquipmentsList", web_ambulances.getAllMedicalEquipmentsList);
    router.post("/getHospitalsList", web_ambulances.getHospitalsList);
    router.post("/updateAmbulanceDetail", web_ambulances.updateAmbulanceDetail);
    router.post("/updateAmbulanceUsageMaintenance", web_ambulances.updateAmbulanceUsageMaintenance);
    router.post("/checkAmbulanceBoxCodeExist", web_ambulances.checkAmbulanceBoxCodeExist);
    router.post("/deleteAmbulance", web_ambulances.deleteAmbulance);
  
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };