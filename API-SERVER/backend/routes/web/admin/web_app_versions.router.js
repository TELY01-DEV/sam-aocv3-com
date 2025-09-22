module.exports = app => {
    const controller = require("../../../controllers/web/admin/web_app_versions.controller");
  
    var router = require("express").Router();
  
    router.post("/getAllAppVersions", controller.getAllAppVersions);
    router.post("/updateAppVersions", controller.updateAppVersions);

    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };