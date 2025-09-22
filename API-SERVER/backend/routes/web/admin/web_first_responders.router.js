module.exports = app => {
    const web_first_responders = require("../../../controllers/web/admin/web_first_responders.controller");
  
    var router = require("express").Router();
  
    router.post("/getFirstRespondersList", web_first_responders.getFirstRespondersList);
    router.post("/updateFirstResponderDetail", web_first_responders.updateFirstResponderDetail);

  
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };