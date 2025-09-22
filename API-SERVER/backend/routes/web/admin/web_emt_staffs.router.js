module.exports = app => {
    const controller = require("../../../controllers/web/admin/web_emt_staffs.controller");
  
    var router = require("express").Router();
  
    router.post("/getEmtStaffsList", controller.getEmtStaffsList);
    router.post("/updateEmtStaffsDetail", controller.updateEmtStaffsDetail);
    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };