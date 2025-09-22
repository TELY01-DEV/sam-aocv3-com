const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { validationResult } = require('express-validator');

const Patients = db.patients;
const AocUsers = db.aoc_users;
const PatientRequests = db.patient_requests;
const AocRequests = db.aoc_requests;
const Hospitals = db.hospitals;
const Ambulances = db.ambulances;

exports.postOngoingRequestList = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        res.send(configure.apiResp(false, 400, {}, errors.array()));
        return;
    }

}