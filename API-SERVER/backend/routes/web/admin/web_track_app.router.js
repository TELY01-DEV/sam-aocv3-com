module.exports = app => {
    const web_ambulances = require("../../../controllers/web/admin/web_track_app.controller");
    const webTrackValidator = require("./validation/web_track_app.validater");

    var router = require("express").Router();
  
    router.post("/getWebTrackAppList", web_ambulances.getWebTrackAppList);
    router.post("/registerWebEjunApp",webTrackValidator.validate('registerWebEjunApp'), web_ambulances.registerWebEjunApp);
    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };