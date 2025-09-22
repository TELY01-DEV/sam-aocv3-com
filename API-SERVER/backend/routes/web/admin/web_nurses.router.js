module.exports = app => {
    const users = require("../../../controllers/web/admin/web_nurses.controller");
  
    var router = require("express").Router();
  
    router.post("/getNursesList", users.getNursesList);
    router.post("/updateNurseDetail", users.updateNurseDetail);
    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };