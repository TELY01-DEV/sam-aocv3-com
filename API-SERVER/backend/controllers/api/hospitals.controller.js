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

exports.postZoneAllHospitalsList =(req,res)=>{
    var AmbulancesListCondition = [
	    { '$match': {
                "$and": [
                    { "isactive": 1 },
                    { "isdeleted": false },
                    // { "zone_id": ObjectId(req.body.zone_id) },
                ]
            }
        },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': '_id',
                'foreignField': 'hospital_id',
                'as': 'ambulancesDetail'
            }
        },
        { '$unwind': '$ambulancesDetail' },
        { '$lookup': {
                from: "aoc_requests",
                let: {
                    ambulance_id: "$ambulancesDetail._id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$ambulance_id",
                                            "$$ambulance_id"
                                        ]
                                    },
                                    {
                                        $eq: [
                                            "$request_status",
                                            "OPERATION_ASSIGNED"
                                        ]
                                    },
                                ]
                            }
                        }
                    }
                ],
                as: "ambulancesDetail.aocRequestsDetail"
            }
        },
        { 
            '$unwind': {
                "path": "$ambulancesDetail.aocRequestsDetail",
                "preserveNullAndEmptyArrays": true
            } 
        },
        {
            '$lookup': {
                'from': 'ambulance_trackings',
                'localField': 'ambulancesDetail._id',
                'foreignField': 'ambulance_id',
                'as': 'ambulancesDetail.ambulanceTrackingsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail.ambulanceTrackingsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$group': {
                '_id': '$_id',
                'full_name': { $first: '$full_name' },
                'name1': { $first: '$name1' },
                'name2': { $first: '$name2' },
                'ambulancesDetail': { $addToSet: {
                        '_id': '$ambulancesDetail._id',
                        'name1': '$ambulancesDetail.name1',
                        'name2': '$ambulancesDetail.name2',
                        'aocRequestsDetail': '$ambulancesDetail.aocRequestsDetail',
                        'ambulanceTrackingsDetail': '$ambulancesDetail.ambulanceTrackingsDetail',
                    }
                },
            }
        },
        {
            '$project': {
                '_id': '$_id',
                'full_name': 1,
                'name1': 1,
                'name2': 1,
                'ambulancesDetail': {
                    '_id': 1,
                    'name1': 1,
                    'name2': 1,
                    'aocRequestDetail': {
                        '_id': 1,
                        'request_status': 1,
                        'request_type': 1,
                    },
                    'ambulanceTrackingsDetail': {
                        '_id': 1,
                        'speed': 1,
                        'estimated_time': 1,
                    }
                },
            }
        }
    ];
    
    Hospitals.aggregate(AmbulancesListCondition)
    .then(data => {
        res.send(configure.apiResp(true, 200, data, '',req.headers.isencryption));
    })
    .catch(err => {
     res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
    });
}