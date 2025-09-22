module.exports = app => {
    const controller = require("../../controllers/aocptt/users_authentication.controller");
    const validater = require("./validations/users_authentication.validater");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postUserLogin", validater.validate('postUserLogin'), controller.postUserLogin);
    
    app.use('/api/aocptt', (req, res, next) => {
        next(); 
    },router);
}