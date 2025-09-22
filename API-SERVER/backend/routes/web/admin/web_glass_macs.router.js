module.exports = app => {
    const users = require("../../../controllers/web/admin/web_glass_macs.controller");
  
    var router = require("express").Router();
  
    router.post("/getGlassMacsList", users.getGlassMacsList);
    router.post("/updateGlassMecDetail", users.updateGlassMecDetail);

    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };