module.exports = app => {
    const users = require("../../../controllers/web/admin/web_doctors.controller");
  
    var router = require("express").Router();
  
    router.post("/getDoctorsList", users.getDoctorsList);
    router.post("/updateDoctorDetail", users.updateDoctorDetail);

    app.use('/api/master', (req, res, next) => {
      next(); 
    },router);
  };