module.exports = app => {
    const controller = require("../../controllers/api/requests.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postOngoingRequestList", controller.postOngoingRequestList);
    router.post("/postOngoingRequestListt", controller.postOngoingRequestListt);

    app.use('/api/requests', (req, res, next) => {
        next(); 
    },router);
  };