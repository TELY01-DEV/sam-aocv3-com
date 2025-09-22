module.exports = app => {
    const controller = require("../../controllers/api/index.controller");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/checkConnection", controller.checkConnection);
    
    app.use('/api/app', (req, res, next) => {
        next(); 
    },router);
}