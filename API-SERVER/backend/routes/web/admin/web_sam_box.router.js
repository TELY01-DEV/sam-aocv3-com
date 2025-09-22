// module.exports = app => {
//     const users = require("../controllers/web_sam_box.controller.js");
  
//     var router = require("express").Router();
  
//     router.post("/getPatientSituationsList", web_sam_box.getPatientSituationsList);
  
//     app.use('/api/master', (req, res, next) => {
//       next(); 
//     },router);
//   };