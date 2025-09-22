module.exports = app => {
    const web_paramedic = require("../../../controllers/web/admin/web_paramedic.controller");
  
    var router = require("express").Router();
  
    router.post("/getParamedicsList", web_paramedic.getParamedicsList);
    router.post("/updateParamedicDetail", web_paramedic.updateParamedicDetail);

  
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };