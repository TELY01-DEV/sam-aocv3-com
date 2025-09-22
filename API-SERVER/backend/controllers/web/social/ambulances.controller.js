const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { validationResult } = require('express-validator');

const Ambulances = db.ambulances;

exports.getAmbulanceSnapTrackEcgDetail = (req, res) => {
    var getAmbulanceSnapTrackEcgDetailCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    { "isactive": 1 },
                ]
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'hospital_id',
                'foreignField': '_id',
                'as': 'hospitalsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$hospitalsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "aoc_requests",
                let: {
                    ambulance_id: "$_id",
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
                                        $ne: [
                                            "$request_status",
                                            "COMPLETED"
                                        ]
                                    },
                                    {
                                        $ne: [
                                            "$request_status",
                                            "CANCELED"
                                        ]
                                    },
                                ]
                            }
                        }
                    }
                ],
                as: "aocRequestsDetail"
            }
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$match': {
                "aocRequestsDetail._id": { '$eq': ObjectId(req.body.aoc_request_id) },
            }
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.request_status_change",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'aoc_users',
                'localField': 'aocRequestsDetail.request_status_change.user_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.request_status_change.aocUsersDetail'
            }
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.request_status_change.aocUsersDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'designations',
                'localField': 'aocRequestsDetail.request_status_change.aocUsersDetail.designation_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.request_status_change.aocUsersDetail.designationsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.request_status_change.aocUsersDetail.designationsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'glass_macs',
                'localField': 'aocRequestsDetail.glass_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.patientGlassMacsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.patientGlassMacsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'fast_tracks',
                'localField': 'aocRequestsDetail.fast_track_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.fastTracksDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.fastTracksDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patient_requests',
                'localField': 'aocRequestsDetail.patient_request_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.patientRequestsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.patientRequestsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patients',
                'localField': 'aocRequestsDetail.patientRequestsDetail.patient_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.patientRequestsDetail.patientsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.patientRequestsDetail.patientsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'ambulance_trackings',
                'localField': '_id',
                'foreignField': 'ambulance_id',
                'as': 'ambulanceTrackingDetail'
            },
        },
        {
            '$unwind': {
                "path": "$ambulanceTrackingDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'ambulance_images',
                'localField': '_id',
                'foreignField': 'ambulance_id',
                'as': 'ambulanceImagesDetail'
            },
        },
        {
            '$unwind': {
                "path": "$ambulanceImagesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'medical_equipments',
                'localField': 'medical_equipment_ids',
                'foreignField': '_id',
                'as': 'medicalEquipmentsDetail'
            },
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'aocRequestsDetail.source._id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.source.hospitalsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.source.hospitalsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'aocRequestsDetail.destination._id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.destination.hospitalsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.destination.hospitalsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patient_monitors',
                'localField': 'aocRequestsDetail.moniter_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.patientMonitorsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail.patientMonitorsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'doctors',
                'localField': 'aocRequestsDetail.doctor_ids',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.doctorsDetail'
            }
        },
        {
            '$lookup': {
                'from': 'nurses',
                'localField': 'aocRequestsDetail.nurse_ids',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.nursesDetail'
            }
        },
        {
            '$lookup': {
                'from': 'drivers',
                'localField': 'aocRequestsDetail.driver_ids',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.driversDetail'
            }
        },
        {
            '$lookup': {
                'from': 'aoc_er_staffs',
                'localField': 'aocRequestsDetail.er_ids',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.aocErStaffsDetail'
            }
        },
        {
            '$lookup': {
                'from': 'aoc_ems_staffs',
                'localField': 'aocRequestsDetail.ems_ids',
                'foreignField': '_id',
                'as': 'aocRequestsDetail.aocEmsStaffsDetail'
            }
        },
        {
            '$group': {
                '_id': '$aocRequestsDetail._id',
                'ambulance_id': { $first: '$_id' },
                'name1': { $first: '$name1' },
                'name2': { $first: '$name2' },
                'number': { $first: '$number' },
                'ambulance_box_code': { $first: '$ambulance_box_code' },
                "sourceHospitalDetail": { $first: '$aocRequestsDetail.source.hospitalsDetail' },
                "destinationHospitalDetail": { $first: '$aocRequestsDetail.destination.hospitalsDetail' },
                "patientsDetail": { $first: '$aocRequestsDetail.patientRequestsDetail.patientsDetail' },
                "aocRequestsDetail": { $first: '$aocRequestsDetail' },
                "requestStatusChange": { $last: '$aocRequestsDetail.request_status_change' },
                "patientRequestsDetail": { $first: '$aocRequestsDetail.patientRequestsDetail' },
                "ambulanceTrackingDetail": { $first: '$ambulanceTrackingDetail' },
                "ambulanceImagesDetail": { $first: '$ambulanceImagesDetail' },
                "medicalEquipmentsDetail": { $first: '$medicalEquipmentsDetail' },
            }
        },
        {
            '$project': {
                "_id": 1,
                "ambulance_id": 1,
                "name1": 1,
                "name2": 1,
                "number": 1,
                "ambulance_box_code": 1,
                "sourceHospitalDetail": {
                    'address': 1,
                    'full_name': 1,
                },
                "destinationHospitalDetail": {
                    'address': 1,
                    'full_name': 1,
                },
                "patientsDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                    "age": 1,
                    "gender": 1
                },
                "requestStatusChange": {
                    'user_id': 1,
                    'request_status': 1,
                    'createdAt': 1,
                    'aocUsersDetail': {
                        '_id': 1,
                        'first_name': 1,
                        'last_name': 1,
                        'designation': '$requestStatusChange.aocUsersDetail.designationsDetail.name1'
                    }
                },
                "aocRequestsDetail": {
                    "_id": 1,
                    "source": 1,
                    "destination": 1,
                    "request_code": 1,
                    'patientGlassMacsDetail': {
                        '_id': 1,
                        'rtmp_url': {
                            $concat: [
                                process.env.STREAMING_SERVER_URL,
                                {
                                    $substr: [
                                        {
                                            "$toString": "$aocRequestsDetail.patientGlassMacsDetail._id"
                                        },
                                        19,
                                        5
                                    ]
                                }
                            ]
                        },
                    },
                    "patientMonitorsDetail": {
                        "name": 1,
                        "type": 1,
                        "web_view": 1,
                        "web_view_url": 1,
                        "is_online": 1,
                        "serial_number": 1
                    },
                    "doctorsDetail": {
                        "first_name": 1,
                        "last_name": 1
                    },
                    "nursesDetail": {
                        "first_name": 1,
                        "last_name": 1
                    },
                    "driversDetail": {
                        "first_name": 1,
                        "last_name": 1
                    },
                    "aocErStaffsDetail": {
                        "first_name": 1,
                        "last_name": 1
                    },
                    "aocEmsStaffsDetail": {
                        "first_name": 1,
                        "last_name": 1
                    },
                    "request_status": {
                        $cond: [
                            { $ifNull: ['$aocRequestsDetail.request_status', false] },
                            '$aocRequestsDetail.request_status',
                            ''
                        ]
                    },

                    "request_type": "$aocRequestsDetail.request_type",
                    "request_note": 1,
                    "fast_track_id": 1,
                    "fastTracksDetail": {
                        '_id': { $ifNull: ['$aocRequestsDetail.fastTracksDetail._id', ''] },
                        'name': { $ifNull: ['$aocRequestsDetail.fastTracksDetail.name', ''] },
                    },
                },
                "patientRequestsDetail": {
                    "diagnosis_note": 1,
                    "sickness_type": 1,
                    'severity_color_code': {
                        $switch: {
                            branches: [
                                { case: { $eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 1] }, then: configure.severityColorPanel._1 },
                                { case: { $eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 2] }, then: configure.severityColorPanel._2 },
                                { case: { $eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 3] }, then: configure.severityColorPanel._3 },
                                { case: { $eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 4] }, then: configure.severityColorPanel._4 },
                                { case: { $eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 5] }, then: configure.severityColorPanel._5 },],
                            default: configure.severityColorPanel._1
                        }
                    },
                    "createdAt": 1
                },
                "ambulanceTrackingDetail": {
                    '_id': 1,
                    "speed": { $toInt: "$ambulanceTrackingDetail.speed" },
                    'location': 1,
                    'source_location': 1,
                    'destination_location': 1,
                    'heading': 1,
                    'covered_distance': 1,
                    "estimated_time": { $toInt: "$ambulanceTrackingDetail.estimated_time" },
                },
                "ambulanceImagesDetail": {
                    "_id": 1,
                    "images": 1,
                },
                "medicalEquipmentsDetail": {
                    "_id": 1,
                    "name": 1,
                    "medical_equipment_image": 1,
                    "icon_image": 1,
                }
            }
        }
    ];

    Ambulances.aggregate(getAmbulanceSnapTrackEcgDetailCondition)
    .then((data) => {
        var resp = {};
        if (data.length) {
            if (data[0].aocRequestsDetail._id) {
                resp.ambulance_data = data;
                resp.medicalEquipmentsurl = configure.fsUploadURL('medicalEquipmentIconImage');
                res.send(configure.apiResp(true, 200, resp, '', req.headers.isencryption));
            } else {
                res.send(configure.apiResp(false, 201, {}, 'Your token get expired.', req.headers.isencryption));
            }
        } else {
            res.send(configure.apiResp(false, 201, {}, 'Ambulance not found.', req.headers.isencryption));
        }
    })
    .catch(err => {
        res.send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.", req.headers.isencryption));
    });
}