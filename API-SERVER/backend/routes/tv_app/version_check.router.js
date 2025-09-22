module.exports = app => {
    const controller = require("../../controllers/tv_app/version_check.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postTvAppVersionCheck", controller.postTvAppVersionCheck);
    
    app.use('/api/tvapp', (req, res, next) => {
        next(); 
    },router);

  };