module.exports = app => {
    const web_authentication = require("../../../controllers/web/user/web_authentication.controller.js");
  
    var router = require("express").Router();
  
    router.post("/signIn", web_authentication.signIn);
    router.post("/signOut", web_authentication.signOut);
  
    app.use('/api/user_auth', (req, res, next) => {
      next(); 
    },router);
  };