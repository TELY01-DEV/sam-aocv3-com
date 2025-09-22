module.exports = app => {
    const controller = require("../../../controllers/web/user/web_user_requests.controller");
  
    var router = require("express").Router();
  
    router.post("/postAmbulanceRequest", controller.postAmbulanceRequest);
    router.post("/postDriversList", controller.postDriversList);
    router.post("/postDoctorsList", controller.postDoctorsList);
    router.post("/postNursesList", controller.postNursesList);
    router.post("/postParamedicsList", controller.postParamedicsList);
    router.post("/postAocErStaffsList", controller.postAocErStaffsList);
    router.post("/postAocEmsStaffsList", controller.postAocEmsStaffsList);
    
    router.post("/postMonitersList", controller.postMonitersList);
    router.post("/postGlassList", controller.postGlassList);
    router.post("/postFastTracksList", controller.postFastTracksList);
    router.post("/patientRequestList", controller.patientRequestList);
    router.post("/getAmbPatientReq", controller.getAmbPatientReq);
    router.post("/postPatientReqAmbulance", controller.postPatientReqAmbulance);
    router.post("/aocRequestHistory", controller.aocRequestHistory);
    router.post("/aocOngoingRequestHistory", controller.aocOngoingRequestHistory);
    router.post("/AocRequestsList", controller.AocRequestsList);
    router.post("/postSeverityColorCodesList", controller.postSeverityColorCodesList);
    router.post("/postPatientReqCancelRequest", controller.postPatientReqCancelRequest);
    
    router.post("/getTotalAocRequest", controller.getTotalAocRequest);
    router.post("/getAocRequestsMembersList", controller.getAocRequestsMembersList);

    router.post("/aocRequestStatusChangeHistory", controller.aocRequestStatusChangeHistory);
    
    app.use('/api/requests', (req, res, next) => {
        next(); 
    }, router);
};