module.exports = app => {
    const controller = require("../../controllers/glass_mac_api/glass_macs.controller.js");
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/postGlassMacsRegister", controller.postGlassMacsRegister);
    router.post("/postGlassMacsStatusChange", controller.postGlassMacsStatusChange);
  
    app.use('/api/glassMacs', (req, res, next) => {
        next(); 
    },router);
  };