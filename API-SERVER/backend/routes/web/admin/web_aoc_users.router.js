module.exports = app => {
  const users = require("../../../controllers/web/admin/web_aoc_users.controller");

  var router = require("express").Router();

  router.post("/getAocUsersList", users.getAocUsersList);
  router.post("/isActiveChange", users.isActiveChange);
  router.post("/updateUserDetail", users.updateUserDetail);
  router.post("/getZonesHospitalsList", users.getZonesHospitalsList);
  router.post("/getHospitalsByUserList", users.getHospitalsByUserList);
  router.post("/checkEmail", users.checkEmail);
  app.use('/api/master', (req, res, next) => {
    next(); 
  },router);
};