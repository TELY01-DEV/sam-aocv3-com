module.exports = app => {
    const users = require("../../../controllers/web/admin/web_aoc_ems_staffs.controller");
  
    var router = require("express").Router();
  
    router.post("/getAocEmsStaffsList", users.getAocEmsStaffsList);
    router.post("/updateEmsstaffDetail", users.updateEmsstaffDetail);

    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };