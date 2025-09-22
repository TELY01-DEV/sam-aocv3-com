module.exports = app => {
    const controller = require("../../controllers/alive/aoc_requests.controller");
    var router = require("express").Router();
  
    router.post("/postPatientsDetailUpdate", controller.postPatientsDetailUpdate);
  
    app.use('/api/alive', (req, res, next) => {
        next(); 
    },router);
  };