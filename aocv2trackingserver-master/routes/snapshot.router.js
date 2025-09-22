module.exports = app => {
    const controller = require("../controllers/snapshot.controller");
    var router = require("express").Router();
  
    router.post("/postAmbulanceImageUpload", controller.postAmbulanceImageUpload);
  
    app.use('/api/snapshot', (req, res, next) => {
        next(); 
    },router);
  };