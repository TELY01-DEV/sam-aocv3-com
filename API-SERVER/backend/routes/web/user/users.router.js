
module.exports = app => {
    const controller = require("../../../controllers/web/user/users.controller");

    var router = require("express").Router();
  
    router.post("/ListUsers", controller.ListUsers);
    router.post("/checkInOutChange", controller.checkInOutChange);
    router.post("/getUserHospital", controller.getUserHospital);
    router.post("/getHospitalsByUserList", controller.getHospitalsByUserList);
    
    app.use('/api/user', (req, res, next) => {
      next(); 
    },router);
  };