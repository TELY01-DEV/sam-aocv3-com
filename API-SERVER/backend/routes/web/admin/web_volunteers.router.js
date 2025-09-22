module.exports = app => {
    const users = require("../../../controllers/web/admin/web_volunteers.controller");
  
    var router = require("express").Router();
  
    router.post("/getAocVolunteersList", users.getAocVolunteersList);
    router.post("/updateVolunteersDetail", users.updateVolunteersDetail);
    
    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };