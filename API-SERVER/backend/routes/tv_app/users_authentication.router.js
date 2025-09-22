module.exports = app => {
    const controller = require("../../controllers/tv_app/users_authentication.controller");
    const validater = require("./validations/users_authentication.validater");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postUserLogin", validater.validate('postUserLogin'), controller.postUserLogin);
    router.post("/postUserDetail", validater.validate('postUserDetail'), controller.postUserDetail);
    router.post("/postUserLogout", validater.validate('postUserLogout'), controller.postUserLogout);
    
    app.use('/api/tvapp/users', (req, res, next) => {
        next(); 
    },router);

  };