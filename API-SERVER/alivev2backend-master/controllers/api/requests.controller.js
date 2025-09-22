const {socket} = require("../../server");

const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const { ObjectID } = require("bson");
const ObjectId = mongoose.Types.ObjectId;

const AocZones = db.aoc_zones;
const AliveUsers = db.alive_users;
const Hospitals = db.hospitals;
const Patients = db.patients;
const PatientRequests = db.patient_requests;
const AocRequests = db.aoc_requests;
const Designations = db.designations;

exports.postOngoingAliveUserReq = (req, res) => {
    let ongoingAliveUserReq = [];

    if(req.body.alive_user_code) {
        ongoingAliveUserReq.push({ '$match': { 'alive_user_code': Number(req.body.alive_user_code) } });
        AliveUsers.findOneAndUpdate({ 'alive_user_code': Number(req.body.alive_user_code) }, { $set: { 'device_token': String(req.body.device_token), 'device_type': String(req.body.device_type) }}).then((e) => { console.log(e) })
    } else {
        ongoingAliveUserReq.push({ '$match': { 'device_code': (req.body.device_code) } });
        AliveUsers.findOneAndUpdate({ 'device_code': (req.body.device_code) }, { $set: { 'device_token': String(req.body.device_token), 'device_type': String(req.body.device_type) }}).then((e) => { console.log(e) })
    }

    ongoingAliveUserReq.push(
        {
            '$lookup': {
                from: "aoc_requests",
                let: {
                    creater_id: "$_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$$creater_id",
                                            "$creater_id"
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
                                    {
                                        $ne: [
                                            "$request_status",
                                            "DEPART_FROM_SCENE"
                                        ]
                                    },
                                    {
                                        $ne: [
                                            "$request_status",
                                            "ARRIVAL_AT_BASE_HOSPITAL"
                                        ]
                                    },
                                    {
                                        $ne: [
                                            "$request_status",
                                            "ARRIVAL_AT_ANOTHER_HOSPITAL"
                                        ]
                                    },
                                    {
                                        $ne: [
                                            "$request_status",
                                            "GO_BACK_TO_BASE_HOSPITAL"
                                        ]
                                    },
                                    {
                                        $ne: [
                                            "$request_status",
                                            "COME_BACK_TO_BASE_HOSPITAL"
                                        ]
                                    },
                                ]
                            }
                        }
                    }
                ],
                as: "aocRequestDetail"
            }
        },
        { "$unwind": '$aocRequestDetail' },
        { "$sort": { 'aocRequestDetail.createdAt': -1 } },
        { "$limit": 1 },
        {
            "$project": {
                "_id": '$aocRequestDetail._id'
            }
        }
    )

    AliveUsers.aggregate(ongoingAliveUserReq).then((alive_users_data) => {
        var resp = {};
        if(alive_users_data.length){
            resp['aoc_requests_id'] = alive_users_data[0]._id;
        }
        res.send(configure.apiResp(true, 200, resp, ''));
    })
}

exports.postAocZonesGeofenceList = (req, res) => {
    var aocZoneListCond = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    { "isactive": 1 },
                ]
            }
        },
        {
            '$redact': {
                '$cond': {
                    if: { '$gt': [{ '$size': { "$ifNull": ["$geofence", []] } }, 0] },
                    then: "$$DESCEND",
                    else: "$$PRUNE"
                }
            }
        },
        {
            '$project': {
                "_id": 1,
                "phone": 1,
                "geofence": 1,
            }
        },
    ];

    AocZones.aggregate(aocZoneListCond).then((aoc_zones_data) => {
            var resp = {};
                resp['data'] = aoc_zones_data; 
            res.send(configure.apiResp(true, 200, resp, ''));
    })
};

exports.postAliveUserCreateRequest = (req, res) => {
    var resp = {}

    new Promise(function (resolve, reject) {
        if(req.body.zone_id){
            resolve(req.body.zone_id);
        }
    }).then(function (aoc_zone_id) {
        var hospitalsListCondition = [
            {
                '$match': {
                    "$and": [
                        { "isactive": 1 },
                        { "isdeleted": false },
                        { "zone_id": ObjectId(aoc_zone_id) },
                    ]
                }
            },
            {
                '$lookup': {
                    from: "ambulances",
                    let: {
                        hospital_id: "$_id",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$hospital_id",
                                                "$hospital_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$isactive",
                                                1
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$isdeleted",
                                                false
                                            ]
                                        },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "ambulancesDetail"
                }
            },
            {
                '$unwind':  "$ambulancesDetail",
            },
            {
                '$lookup': {
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
                                                "$$ambulance_id",
                                                "$ambulance_id"
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
                    as: "ambulancesDetail.aocRequestDetail"
                }
            },
            {
                '$redact': {
                    '$cond': {
                        if: { '$gt': [{ '$size': { "$ifNull": ["$ambulancesDetail.aocRequestDetail", []] } }, 0] },
                        then: "$$PRUNE",
                        else: "$$DESCEND"
                    }
                }
            },
            {
                '$project': {
                    "_id": 1,
                    "name1": 1,
                    "name2": 1,
                    "full_name": 1,
                    "phone": 1,
                    "location": 1,
                    "ambulancesDetail": {
                        "_id": 1,
                    }
                }
            },
        ];

        return AocZones.findOne({ _id: ObjectId(aoc_zone_id) }, { _id: 1, phone: 1 }).then((aoc_zones_data) => {
            resp['contact_number'] = aoc_zones_data['phone'];
            return Hospitals.aggregate(hospitalsListCondition).then((hospitals_data) => {
                if(hospitals_data.length){
                    var data = {};
                    
                    return AliveUsers.findOne({alive_user_code : req.body.alive_user_code, device_code: req.body.device_code }, { _id: 1 }).then((alive_users_data) => {
                        if(alive_users_data){
                            data['alive_users_data'] = alive_users_data;
                            data['contact_number'] = resp['contact_number'];
                            return (data);
                        } else {
                            var alive_users = new AliveUsers({
                                first_name : (req.body.alive_user_first_name)?(req.body.alive_user_first_name):'',
                                last_name : (req.body.alive_user_last_name)?(req.body.alive_user_last_name):'',
                                device_type: (req.body.device_type)?(req.body.device_type):'',
                                device_token: (req.body.device_token)?(req.body.device_token):'',
                                device_code: (req.body.device_code)?(req.body.device_code):'',
                                app_version: (req.body.app_version)?(req.body.app_version):'',
                                alive_user_code: (req.body.alive_user_code)?(req.body.alive_user_code):0,
                                location: {
                                    lat: (req.body.lat)?(req.body.lat):'',
                                    lon: (req.body.lon)?(req.body.lon):'',
                                }
                            })
                    
                            return alive_users.save(alive_users).then((alive_users_data) => {
                                data['alive_users_data'] = alive_users_data;
                                data['contact_number'] = resp['contact_number'];
                                return (data);
                            }).catch(err => {
                                res.status(500).send({
                                    message:
                                        err.message || "Some error occurred while creating Alive-User."
                                });
                            });
                        }
                    })
                } else {
                    res.send(configure.apiResp(true, 201, resp, 'No hospital found with available Ambulance.'));
                }
            })
        })
    }).then(function (data) {
        var alive_users_data = data['alive_users_data'];
        var contact_number = data['contact_number'];

        var patients = new Patients({
            first_name: req.body.first_name,
            last_name: (req.body.last_name)?(req.body.last_name):'',
            age: (req.body.age)?Number(req.body.age):0,
            gender: (req.body.gender)?(req.body.gender):2,
            unique_hn_code: (req.body.unique_hn_code)?(req.body.unique_hn_code):''
        })

        return patients.save(patients).then((patients_data) => {
            var data = {};
            data['alive_users_data'] = alive_users_data;
            data['patients_data'] = patients_data;
            data['contact_number'] = contact_number;

            return (data);
        }).catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating Patient."
            });
        });
    }).then(function (data) {
        var alive_users_data = data['alive_users_data'];
        var contact_number = data['contact_number'];

        var patient_requests = new PatientRequests({
            patient_id: ObjectId(data.patients_data._id),
            zone_id: ObjectId(req.body.zone_id),
            sickness_type: req.body.sickness_type,
            source: { 
                address: String(req.body.source_address), 
                location: {
                    lat: (req.body.lat)?(req.body.lat):'',
                    lon: (req.body.lon)?(req.body.lon):'',
                }
            },
            // severity_level: req.body.severity_level,
            // diagnosis_note: req.body.diagalive_users_datanosis_note,
            request_status: 'IDEAL',
        })

        return patient_requests.save(patient_requests).then((patient_requests_data) => {
            var data = {};
            data['alive_users_data'] = alive_users_data;
            data['patient_requests_data'] = patient_requests_data;
            data['contact_number'] = contact_number;
            return (data);
        }).catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating Patient Request."
            });
        });
    }).then(function (data) {
        var contact_number = data['contact_number'];
        Designations.findOne({'name1' : "Alive Users"}).then(designation_data=>{
        var aoc_requests = new AocRequests({
            creater_id: ObjectId(data.alive_users_data._id),
            creater_type :ObjectId(designation_data._id),
            request_status: 'IDEAL',
            request_type: 'EMS',
            patient_request_id: ObjectId(data.patient_requests_data._id),
            request_code: 'ID-OTHER-' + ("0" + (new Date()).getDate()).slice(-2) + ("0" + ((new Date()).getMonth() + 1)).slice(-2) + ("0" + (new Date()).getFullYear()).slice(-4),
            destination: { 
                address: String(req.body.source_address), 
                location: {
                    lat: (req.body.lat)?(req.body.lat):'',
                    lon: (req.body.lon)?(req.body.lon):'',
                }
            },
        })
    
        aoc_requests.save(aoc_requests).then((data) => {
            var socket_data = {
                aoc_requests_id: data._id,
                type: 'NEW_REQUEST_NOTIFY',
            }

            socket.emit('NEW_REQUEST_NOTIFY_' + String(req.body.zone_id), socket_data); // FOR USER PANEL CRASH NOTIFY...

            resp['contact_number'] = contact_number;
            resp['aocRequestsDetail'] = { _id: data._id};
            res.send(configure.apiResp(true, 200, resp, ''));
        })
    })
    }).catch(err => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while creating Aoc Request."
        });
    });
};

exports.postAliveUserGetRequestStatus = (req, res) => {
    var aliveUserGetRequestStatusCond = [
        { '$match': { '_id': ObjectId(req.body.aoc_requests_id) } },
        {
            '$lookup': {
                'from': 'fast_tracks',
                'localField': 'fast_track_id',
                'foreignField': '_id',
                'as': 'fastTracksDetail'
            },
        },
        {
            '$unwind': {
                "path": "$fastTracksDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'source._id',
                'foreignField': '_id',
                'as': 'source.hospitalsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$source.hospitalsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'destination._id',
                'foreignField': '_id',
                'as': 'destination.hospitalsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$destination.hospitalsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                "from": "doctors",
                "localField": "doctor_ids",
                "foreignField": "_id",
                "as": "doctorsDetail"
            }
        },
        {
            '$lookup': {
                "from": "drivers",
                "localField": "driver_ids",
                "foreignField": "_id",
                "as": "driversDetail"
            }
        },
        {
            '$lookup': {
                "from": "nurses",
                "localField": "nurse_ids",
                "foreignField": "_id",
                "as": "nursesDetail"
            }
        },
        {
            '$lookup': {
                "from": "aoc_er_staffs",
                "localField": "er_ids",
                "foreignField": "_id",
                "as": "aocErStaffsDetail"
            }
        },
        {
            '$lookup': {
                "from": "aoc_ems_staffs",
                "localField": "ems_ids",
                "foreignField": "_id",
                "as": "aocEmsStaffsDetail"
            }
        },
        {
            '$lookup': {
                'from': 'patient_requests',
                'localField': 'patient_request_id',
                'foreignField': '_id',
                'as': 'patientRequestsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$patientRequestsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patients',
                'localField': 'patientRequestsDetail.patient_id',
                'foreignField': '_id',
                'as': 'patientsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$patientsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patient_monitors',
                'localField': 'moniter_id',
                'foreignField': '_id',
                'as': 'patientMonitorsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$patientMonitorsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'glass_macs',
                'localField': 'glass_id',
                'foreignField': '_id',
                'as': 'glassMacsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$glassMacsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'ambulance_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail'
            },
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'medical_equipments',
                'localField': 'ambulancesDetail.medical_equipment_ids',
                'foreignField': '_id',
                'as': 'ambulancesDetail.medicalEquipmentsDetail'
            },
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
            '$lookup': {
                'from': 'ambulance_images',
                'localField': 'ambulancesDetail._id',
                'foreignField': 'ambulance_id',
                'as': 'ambulancesDetail.ambulanceImagesDetail'
            },
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail.ambulanceImagesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$project': {
                "_id": 1,
                "is_trauma": 1,
                "destination": {
                    "location": 1,
                    "address": 1,
                    "hospitalsDetail": {
                        "_id": 1,
                        "name1": 1,
                        "name2": 1,
                        "full_name": 1,
                        "address": 1
                    }
                },
                "source": {
                    "location": 1,
                    "address": 1,
                    "hospitalsDetail": {
                        "_id": 1,
                        "name1": 1,
                        "name2": 1,
                        "full_name": 1,
                        "address": 1,
                        "location":1
                    }
                },
                "request_status": {
                    $cond: [
                        { $ifNull: ['$request_status', false] },
                        '$request_status',
                        ''
                    ]
                },
                "request_type": 1,
                "request_note": 1,
                "request_code": 1,
                "fastTracksDetail": {
                    "_id": 1,
                    "name": 1
                },
                "doctorsDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                },
                "driversDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                },
                "nursesDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                },
                "aocErStaffsDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                },
                "aocEmsStaffsDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                },
                "patientMonitorsDetail": {
                    "_id": 1,
                    "name": 1,
                    "type": 1,
                    "serial_number": 1,
                    "web_address": 1,
                    "web_view_url": 1,
                    "web_view": 1,
                    "web_port": 1,
                    "is_online": 1,
                },
                "glassMacsDetail": {
                    '_id': 1,
                    'name': 1,
                    'mac_address': 1,
                    'is_online': 1,
                    "rtmp_url": {
                        $cond: [
                            { $ifNull: ["$glassMacsDetail._id", false] },
                            { 
                                $concat: [
                                    "rtmp://stm.aocopt.com:1935/live/temp_", { 
                                        $substr: [{ $toString: "$glassMacsDetail._id"
                                        }, { $subtract: [{ $strLenCP: { $toString: "$glassMacsDetail._id" } }, 5] }, { $strLenCP: { $toString: "$glassMacsDetail._id" } }]
                                    }
                                ]
                            },
                            ''
                        ]
                    },
                },
                "is_assign": {
                    $cond: [
                        { $ifNull: ['$ambulance_id', false] },
                        1,
                        0
                    ]
                },
                "ambulancesDetail": {
                    "_id": 1,
                    "name1": 1,
                    "name2": 1,
                    "ambulance_phone": 1,
                    "number": 1,
                    "ambulance_box_code": 1,
                    "is_online": 1,
                    "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
                    "is_tracking_on": {
                        $cond: {
                            if: {
                                "$gt": [
                                    { "$subtract": [new Date(), "$ambulancesDetail.ambulanceTrackingsDetail.updatedAt"] },
                                    configure.AMB_TRAKCING_TIMEOUT
                                ]
                            },
                            then: 0,
                            else: 1,
                        }
                    },
                    "ambulanceTrackingsDetail": {
                        $ifNull: [
                            {
                                "_id": "$ambulancesDetail.ambulanceTrackingsDetail._id",
                                "location": "$ambulancesDetail.ambulanceTrackingsDetail.location",
                                "heading": "$ambulancesDetail.ambulanceTrackingsDetail.heading",
                                "speed": "$ambulancesDetail.ambulanceTrackingsDetail.speed",
                                "estimated_time": { $toInt: { $ifNull: ["$ambulancesDetail.ambulanceTrackingsDetail.estimated_time", 0 ] }  },
                                "covered_distance": { $toInt: { $ifNull: ["$ambulancesDetail.ambulanceTrackingsDetail.covered_distance", 0 ] } },
                                "speed_color_code": {
                                    $switch: {
                                        branches: [
                                            { case: { $gt: [{ $toInt: "$ambulancesDetail.ambulanceTrackingsDetail.speed" }, 120] }, then: configure.speedColor.GT_120 },
                                            { case: { $gt: [{ $toInt: "$ambulancesDetail.ambulanceTrackingsDetail.speed" }, 80] }, then: configure.speedColor.GT_80_LTE_120 },
                                            { case: { $lte: [{ $toInt: "$ambulancesDetail.ambulanceTrackingsDetail.speed" }, 80] }, then: configure.speedColor.LTE_80 }],
                                        default: configure.speedColor.LTE_80
                                    }
                                }
                            }, {}]
                    },

                    "ambulanceImagesDetail": {
                        $ifNull: ["$ambulancesDetail.ambulanceImagesDetail.images", {}]
                    },
                },
                "patientRequestsDetail": {
                    "_id": 1,
                    "severity_level": 1,
                    "severity_color_code": {
                        '$switch': {
                            'branches': [
                                { 'case': { '$eq': [{ '$toInt': "$patientRequestsDetail.severity_level" }, 1] }, then: configure.severityColor._1 },
                                { 'case': { '$eq': [{ '$toInt': "$patientRequestsDetail.severity_level" }, 2] }, then: configure.severityColor._2 },
                                { 'case': { '$eq': [{ '$toInt': "$patientRequestsDetail.severity_level" }, 3] }, then: configure.severityColor._3 },
                                { 'case': { '$eq': [{ '$toInt': "$patientRequestsDetail.severity_level" }, 4] }, then: configure.severityColor._4 },
                                { 'case': { '$eq': [{ '$toInt': "$patientRequestsDetail.severity_level" }, 5] }, then: 'configure.severityColor._5' },],
                            default: 'configure.severityColor._1'
                        }
                    },
                    "diagnosis_note": 1,
                    "source": 1
                },
                "patientsDetail": {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                    "age": 1,
                    "gender": 1
                },
                "medicalEquipmentsDetail": {
                    "_id": 1,
                    "name": 1,
                    "is_visible": 1,
                    "picture": 1,
                    "icon_image": 1
                },
            }
        },
        {
            '$project': {
                "_id": 1,
                "is_trauma": 1,
                "destination": 1,
                "source": 1,
                "request_status": 1,
                "request_type": 1,
                "request_note": 1,
                "request_code": 1,
                "fastTracksDetail": 1,
                "doctorsDetail": 1,
                "driversDetail": 1,
                "nursesDetail": 1,
                "aocErStaffsDetail": 1,
                "aocEmsStaffsDetail": 1,
                "patientMonitorsDetail": 1,
                "glassMacsDetail": 1,
                "is_assign": 1,
                "ambulancesDetail": {
                    "_id": 1,
                    "name1": 1,
                    "name2": 1,
                    "ambulance_phone": 1,
                    "number": 1,
                    "ambulance_box_code": 1,
                    "is_online": 1,
                    "tracking_server_url": 1,
                    "is_tracking_on": 1,
                    "ambulanceTrackingsDetail": {
                        "_id": 1,
                        "location": 1,
                        "heading": 1,
                        "speed": 1,
                        "estimated_time": 1,
                        "covered_distance": 1,
                        "speed_color_code": {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $and: [
                                                { $eq: [{ $toInt: "$ambulancesDetail.is_tracking_on" }, 1] },
                                                { $eq: [{ $toInt: "$is_assign" }, 1] }
                                            ]
                                        }, then: '$ambulanceTrackingsDetail.speed_color_code'
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $eq: [{ $toInt: "$ambulancesDetail.is_tracking_on" }, 1] },
                                                { $eq: [{ $toInt: "$is_assign" }, 0] }
                                            ]
                                        }, then: configure.trackingAssignColor.TR_1_ASN_0
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $eq: [{ $toInt: "$ambulancesDetail.is_tracking_on" }, 0] },
                                                { $eq: [{ $toInt: "$is_assign" }, 1] }
                                            ]
                                        }, then: configure.trackingAssignColor.TR_0_ASN_1
                                    }
                                ],
                                default: configure.trackingAssignColor.TR_0_ASN_1
                            }
                        },
                    },
                    "ambulanceImagesDetail": 1,
                },
                "patientRequestsDetail": 1,
                "patientsDetail": 1,
                "medicalEquipmentsDetail": 1,
            }
        }
    ];

    AocRequests.aggregate(aliveUserGetRequestStatusCond).then((aoc_requests_data) => {
        var resp = {};
        resp = aoc_requests_data[0];
        res.send(configure.apiResp(true, 200, resp, ''));
    })
};

exports.postAliveUserCancelRequest = (req, res) => {
    AocRequests.findOneAndUpdate({ _id: ObjectId(req.body.aoc_requests_id) }, { $set: { 'request_status': 'CANCELED' }}, { new: true }).then((aoc_requests_data) => {
        PatientRequests.findOneAndUpdate({ _id: ObjectId(aoc_requests_data.patient_request_id) }, { $set: { 'request_status': 'CANCELED' }}, { new: true }).then((patient_requests_data) => { 
            var resp = {};
                resp['data'] = aoc_requests_data; 
            res.send(configure.apiResp(true, 200, resp, ''));
        })
    })
};