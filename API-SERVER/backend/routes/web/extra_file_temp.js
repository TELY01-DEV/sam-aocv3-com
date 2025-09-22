module.exports = app => {

  const web_ambulances = require("../../controllers/web/user/web_user_ambulances.controller");

  var router = require("express").Router();

  router.post("/getUserAmbulanceList", web_ambulances.getUserAmbulanceList);
  router.post("/postAmbulanceRequest", web_ambulances.postAmbulanceRequest);

  app.use('/api/user-ambulance', (req, res, next) => {
    next(); 
  },router);
};