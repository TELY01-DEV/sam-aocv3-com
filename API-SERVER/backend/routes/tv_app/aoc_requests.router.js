module.exports = app => {
    const controller = require("../../controllers/tv_app/aoc_requests.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postAliveRequestDetail", controller.postAliveRequestDetail);
    
    app.use('/api/tvapp/requests', (req, res, next) => {
        next(); 
    },router);
  };