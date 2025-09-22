module.exports = app => {
    const users = require("../../../controllers/web/admin/web_drivers.controller");
  
    var router = require("express").Router();
  
    router.post("/getDriversList", users.getDriversList);
    router.post("/updateDriverDetail", users.updateDriverDetail);

    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };