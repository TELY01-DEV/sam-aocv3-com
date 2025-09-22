module.exports = app => {
    const controller = require("../../../controllers/web/user/web_user_notification.controller");

    var router = require("express").Router();

    router.post("/updateUserNotification", controller.updateUserNotification);
    router.post("/getUserNotification", controller.getUserNotification);

    app.use('/api/userNotification', (req, res, next) => {
      next(); 
    },router);

}