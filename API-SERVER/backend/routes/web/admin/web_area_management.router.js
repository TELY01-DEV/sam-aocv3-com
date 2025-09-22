module.exports = app => {
    const web_area_management = require("../../../controllers/web/admin/web_area_management.controller");
  
    var router = require("express").Router();
  
    router.post("/getProvinceList", web_area_management.getProvinceList);
    router.post("/getDistrictList", web_area_management.getDistrictList);
    router.post("/getSubDistrictList", web_area_management.getSubDistrictList);

    router.post("/updateProvinceDetail", web_area_management.updateProvinceDetail);
    router.post("/deleteProvince", web_area_management.deleteProvince);

    
    router.post("/getAllProvinceList", web_area_management.getAllProvinceList);
    router.post("/updateDistrictDetail", web_area_management.updateDistrictDetail);
    router.post("/deleteDistrict", web_area_management.deleteDistrict);
    
    router.post("/getAllDistrictList", web_area_management.getAllDistrictList);
    router.post("/updateSubDistrictDetail", web_area_management.updateSubDistrictDetail);
    router.post("/deleteSubDistrict", web_area_management.deleteSubDistrict);
    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };