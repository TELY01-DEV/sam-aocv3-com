module.exports = app => {
    const users = require("../../../controllers/web/admin/web_aoc_er_staffs.controller");
  
    var router = require("express").Router();
  
    router.post("/getAocErStaffsList", users.getAocErStaffsList);
    router.post("/updateErstaffDetail", users.updateErstaffDetail);
    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };