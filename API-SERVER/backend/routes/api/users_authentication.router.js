module.exports = app => {
    const controller = require("../../controllers/api/users_authentication.controller");
    const validater = require("./validations/users_authentication.validater");
    var router = require("express").Router();
    
    // Create a new Tutorial
    router.post("/postAllZoneList", controller.postAllZoneList);
    router.post("/postHospitalList", controller.postHospitalList);
    router.post("/postDesignationList", controller.postDesignationList);
    router.post("/postUserExistCheck", validater.validate('postUserExistCheck'), controller.postUserExistCheck);
    router.post("/postUserRegister", validater.validate('postUserRegister'), controller.postUserRegister);
    router.post("/postUserLogin", validater.validate('postUserLogin'), controller.postUserLogin);
    router.post("/postUserDetail", validater.validate('postUserDetail'), controller.postUserDetail);
    router.post("/postUserDetailUpdate", validater.validate('postUserDetailUpdate'), controller.postUserDetailUpdate);
    router.post("/postUserPushSettingUpdate", validater.validate('postUserPushSettingUpdate'), controller.postUserPushSettingUpdate);
    router.post("/postUserLogout", validater.validate('postUserLogout'), controller.postUserLogout);
    
    app.use('/api/users', (req, res, next) => {
        next(); 
    },router);
}