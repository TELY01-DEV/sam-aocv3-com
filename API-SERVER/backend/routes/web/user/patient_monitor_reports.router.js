module.exports = app => {
    const controller = require("../../../controllers/web/user/patient_monitor_reports.controller");
    var router = require("express").Router();
  
    router.post("/postUserMonitorList", controller.postUserMonitorList);
    router.post("/postUserMonitorReportDetail", controller.postUserMonitorReportDetail);
    app.use('/api/report', (req, res, next) => {
        next(); 
    },router);
  };