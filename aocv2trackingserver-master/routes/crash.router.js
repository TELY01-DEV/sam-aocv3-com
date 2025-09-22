module.exports = app => {
    const controller = require("../controllers/crash.controller");
    var router = require("express").Router();
  
    router.post("/postAmbulanceCrashNotify", controller.postAmbulanceCrashNotify);
  
    app.use('/api/crash', (req, res, next) => {
        next(); 
    },router);
  };