const { redisClient } = require("../../../server");

const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const fcmPush = require("../../../config/fcm-push");
var request = require('request');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const AocUsers = db.aoc_users;
const AliveUsers = db.alive_users;
const Designations = db.designations;
const AocRequests = db.aoc_requests;
const Ambulance_Trackings = db.ambulance_trackings;
const PatientRequests = db.patient_requests;
const Patients = db.patients;
const fs = require('fs');

exports.postAocRequestStatusChange = (req, res) => {
    var aoc_requests = { 'request_status': String(req.body.request_status) };
    var next_status = '', previous_status = '';
    AocRequests.findOne({ _id: req.body.aoc_request_id })
        .then(data => {
            request_status = data.request_status;

            if(data.request_type == 'EMS'){
                switch (String(req.body.request_status)) {
                    case 'OPERATION_ASSIGNED':
                        next_status = 'START_OPERATION';
                        previous_status = '';
                        break;
    
                    case 'START_OPERATION':
                        next_status = 'DEPART_FROM_BASE_HOSPITAL';
                        previous_status = 'OPERATION_ASSIGNED';
                        break;
    
                    case 'DEPART_FROM_BASE_HOSPITAL':
                        next_status = 'ARRIVAL_AT_SCENE';
                        previous_status = 'START_OPERATION';
                        break;
    
                    case 'ARRIVAL_AT_SCENE':
                        next_status = 'GO_TO_BASE_HOSPITAL, GO_TO_ANOTHER_HOSPITAL';
                        previous_status = 'DEPART_FROM_BASE_HOSPITAL';
                        break;
    
                    case 'GO_TO_BASE_HOSPITAL':
                        next_status = 'DEPART_FROM_SCENE';
                        previous_status = 'ARRIVAL_AT_SCENE';
                        if (req.body.request_type == "NEXT") aoc_requests['destination_type'] = 'BASE';
                        break;
    
                    case 'GO_TO_ANOTHER_HOSPITAL':
                        next_status = 'DEPART_FROM_SCENE';
                        previous_status = 'ARRIVAL_AT_SCENE';
                        // if (req.body.request_type == "NEXT") {
                            aoc_requests['destination'] = data.destination;
                            aoc_requests['destination_type'] = 'ANOTHER';
                            aoc_requests['destination']['_id'] = (req.body.hospital_id && req.body.hospital_id !== '') ? ObjectId(req.body.hospital_id) : '';
                        // }
                        break;
    
                    case 'DEPART_FROM_SCENE':
                        if (request_status == 'GO_TO_BASE_HOSPITAL') {
                            next_status = 'ARRIVAL_AT_BASE_HOSPITAL'
                            previous_status = 'GO_TO_BASE_HOSPITAL'
                        } else {
                            next_status = 'ARRIVAL_AT_ANOTHER_HOSPITAL';
                            previous_status = 'GO_TO_ANOTHER_HOSPITAL';
                        }
                        break;
    
                    case 'ARRIVAL_AT_BASE_HOSPITAL':
                        next_status = 'COMPLETED';
                        previous_status = 'DEPART_FROM_SCENE';
                        break;
    
                    case 'ARRIVAL_AT_ANOTHER_HOSPITAL':
                        next_status = 'GO_BACK_TO_BASE_HOSPITAL';
                        previous_status = 'DEPART_FROM_SCENE';
                        break;
    
                    case 'GO_BACK_TO_BASE_HOSPITAL':
                        next_status = 'COME_BACK_TO_BASE_HOSPITAL';
                        previous_status = 'ARRIVAL_AT_ANOTHER_HOSPITAL';
                        break;
    
                    case 'COME_BACK_TO_BASE_HOSPITAL':
                        next_status = 'COMPLETED';
                        previous_status = 'GO_BACK_TO_BASE_HOSPITAL';
                        break;
    
                    case 'COMPLETED':
                        next_status = '';
                        previous_status = '';
                        break;
    
                    case 'CANCELED':
                        next_status = '';
                        previous_status = '';
                        break;
                }
            } else {
                switch (String(req.body.request_status)) {
                    case 'OPERATION_ASSIGNED':
                        next_status = 'START_OPERATION';
                        previous_status = '';
                        break;
    
                    case 'START_OPERATION':
                        next_status = 'DEPART_FROM_BASE_HOSPITAL';
                        previous_status = 'OPERATION_ASSIGNED';
                        break;
    
                    case 'DEPART_FROM_BASE_HOSPITAL':
                        next_status = 'ARRIVAL_AT_ANOTHER_HOSPITAL';
                        previous_status = 'START_OPERATION';
                        break;
    
                    case 'ARRIVAL_AT_ANOTHER_HOSPITAL':
                        next_status = 'GO_BACK_TO_BASE_HOSPITAL';
                        previous_status = 'DEPART_FROM_BASE_HOSPITAL';
                        break;
    
                    case 'GO_BACK_TO_BASE_HOSPITAL':
                        next_status = 'COME_BACK_TO_BASE_HOSPITAL';
                        previous_status = 'ARRIVAL_AT_ANOTHER_HOSPITAL';
                        break;
    
                    case 'COME_BACK_TO_BASE_HOSPITAL':
                        next_status = 'COMPLETED';
                        previous_status = 'GO_BACK_TO_BASE_HOSPITAL';
                        break;
    
                    case 'COMPLETED':
                        next_status = '';
                        previous_status = '';
                        break;
    
                    case 'CANCELED':
                        next_status = '';
                        previous_status = '';
                        break;
                }
            }

            if (req.body.request_status == "CANCELED" || req.body.request_status == "COMPLETED") {
                let set_location = {
                    destination_location: {
                        lat: 0,
                        lon: 0
                    },
                    source_location: {
                        lat: 0,
                        lon: 0
                    }
                }
                Ambulance_Trackings.findOneAndUpdate({ ambulance_id:data.ambulance_id},{$set :set_location }).then();
            }

            if (data.request_status_change && data.request_status_change.length > 0) {
                
                aoc_requests['request_status_change_log'] = data.request_status_change_log;

                aoc_requests['request_status_change_log'].push({
                    'user_id': ObjectId(req.body.user_id),
                    'request_status': String(req.body.request_status),
                    'createdAt': new Date(),
                    // 'location':{
                    //     lat:0,
                    //     lon:0
                    // }
                })

                aoc_requests['request_status_change'] = data.request_status_change;
               
                // let t = Date.now() - (data.request_status_change[(data.request_status_change.length - 1)].createdAt).getTime();
                // let minutes_diff = Math.floor(t/60000) + ' MM'
                // let seconds_diff = Math.floor((t%60000)/1000) + ' SS'
                // let time_duration = minutes_diff + ' : ' + seconds_diff;
                if((String(data.request_status_change[(data.request_status_change.length - 1)].request_status) == previous_status) || String(req.body.request_status) == 'COMPLETED' || String(req.body.request_status) == 'CANCELED'){
                    aoc_requests['request_status_change'].push({
                        'user_id': ObjectId(req.body.user_id),
                        'request_status': String(req.body.request_status),
                        'createdAt': new Date(),
                        // 'time_duration': time_duration,
                        // 'location':{
                        //     lat:0,
                        //     lon:0
                        // }
                    })
                } else {
                    aoc_requests['request_status_change'].splice(-1,1);
                }
            } else {
                aoc_requests['request_status_change'] = [];
                aoc_requests['request_status_change_log'] = [];

                aoc_requests['request_status_change'] = [{
                    'user_id': ObjectId(req.body.user_id),
                    'request_status': String(req.body.request_status),
                    'createdAt': new Date(),
                    // 'location':{
                    //     lat:0,
                    //     lon:0
                    // }
                }]

                aoc_requests['request_status_change_log'] = [{
                    'user_id': ObjectId(req.body.user_id),
                    'request_status': String(req.body.request_status),
                    'createdAt': new Date(),
                    // 'location':{
                    //     lat:0,
                    //     lon:0
                    // }
                }]
            }

            AocRequests.findOneAndUpdate({ _id: req.body.aoc_request_id }, { $set: aoc_requests }, { new: true })
                .then(data => {
                    if(String(req.body.request_status) == 'COMPLETED' || String(req.body.request_status) == 'CANCELED'){
                        redisClient.hmset(String(data.ambulance_id), 'is_assign', 0);
                    }

                    configure.getUserDetail({ _id: ObjectId(data.creater_id) }, { _id: ObjectId(data.creater_type) }, {}, (user => {
                        var query = {}
                        if (user.user_data && user.user_data.designation_id) {
                            query = { _id: ObjectId(user.user_data.designation_id) }
                        } else {
                            query = { _id: ObjectId(data.creater_type) }
                        }

                        Designations.findOne(query).then(designation_data => {

                            let data_status = aoc_requests['request_status_change'].splice(-1)[0]
                            if (!user.user_data && user.user_data !== null && user.user_data !== 'null') {
                                data_status['aocUsersDetail'] = {
                                    first_name: user.user_data.first_name ? user.user_data.first_name : "",
                                    last_name: user.user_data.last_name ? user.user_data.last_name : "",
                                    designation: designation_data.name1 ? designation_data.name1 : "",
                                }
                            }
                            if (user.user_data == null) data_status['error_message'] = "User is removed!"
                            var response = {};
                            response['data'] = {
                                request_status: request_status,
                                request_status_change: data_status,
                                next_status: next_status,
                                previous_status: previous_status
                            };
                         
                            try {
                                configure.statusChangePushNotification(data._id, "OPERATION_STATUS_" + req.body.request_status);
                            } catch (error) {
                                console.log(error);                                
                            }
                            res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));
                        })
                    }))
                })
                .catch(err => {
                    res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving AocRequests.", req.headers.isencryption));
                })
        }).catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving AocRequests.", req.headers.isencryption));
        })
}

exports.getZoneHospitalsList = (req, res) => {

    var getZoneHospitalsListCondition = [
        { '$match': { _id: { $eq: ObjectId(req.body.aoc_request_id) } } },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'ambulance_id',
                'foreignField': '_id',
                'as': 'ambulancesDetails'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'ambulancesDetails.hospital_id',
                'foreignField': '_id',
                'as': 'ambulancesDetails.hospitalsDetails'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetails.hospitalsDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'ambulancesDetails.hospitalsDetails.zone_id',
                'foreignField': 'zone_id',
                'as': 'hospitalsDetails'
            }
        },
        {
            '$unwind': {
                "path": "$hospitalsDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$group': {
                '_id': '$hospitalsDetails._id',
                'name1': { $first: '$hospitalsDetails.name1' },
                'name2': { $first: '$hospitalsDetails.name2' },
                'full_name': { $first: '$hospitalsDetails.full_name' },
            }
        },
        {
            '$project': {
                '_id': 1,
                'name1': 1,
                'name2': 1,
                'full_name': 1,
            }
        }
    ]

    AocRequests.aggregate(getZoneHospitalsListCondition)
        .then(data => {
            var response = {};
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));
        }).catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Hospitals.", req.headers.isencryption));
        });
};

exports.postAliveRequestDetail = (req, res) => {
    const aocRrequestDetail = [];
    aocRrequestDetail.push({
        '$match': { _id: { $eq: ObjectId(req.body.aoc_request_id) } }
    })
    aocRrequestDetail.push(
        {
            '$lookup': {
                'from': 'patient_requests',
                'localField': 'patient_request_id',
                'foreignField': '_id',
                'as': 'patientRequestsDetail'
            }
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
                'as': 'patientRequestsDetail.patientsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$patientRequestsDetail.patientsDetail",
                "preserveNullAndEmptyArrays": true
            }
        }
    )
    aocRrequestDetail.push({
        '$project': {
            '_id': 1,
            'updatedAt': 1,
            'destination': {
                'address': 1,
                'location': 1
            },
            'patientRequestsDetail': {
                '_id': 1,
                'sickness_type': 1,
                'zone_id': 1,
                'location_image': { $ifNull: ['$patientRequestsDetail.location_image', ''] },
                'location_image_url': "/uploads/patient_requests/location_images/",
                'patientsDetail': {
                    '_id': 1,
                    'first_name': 1,
                    'last_name': 1,
                    'profile_image': { $ifNull: ['$patientRequestsDetail.patientsDetail.profile_image', ''] },
                    'profile_image_url': "/uploads/patients/profile_image/",
                    'phone': { $ifNull: ['$patientRequestsDetail.patientsDetail.phone', ''] }
                }
            }
        }
    })
    AocRequests.aggregate(aocRrequestDetail).then(data => {
        var response = data[0]
        response['patientRequestsDetail']['location_image'] = `location_${response.patientRequestsDetail._id}.png`
        new Promise((resolve, reject) => {
            request({
                uri: "https://maps.googleapis.com/maps/api/staticmap?center=" + String(response.destination.location.lat) + "," + String(response.destination.location.lon) + "&zoom=16&size=800x450&maptype=roadmap&markers=color:red%7C" + String(response.destination.location.lat) + ",%20" + String(response.destination.location.lon) + "&key=" + String(process.env.GOOGLE_MAP_KEY),
            })
                .pipe(fs.createWriteStream(configure.fsUploadURL("patientRequestLocationImage") + `location_${response.patientRequestsDetail._id}.png`))
                .on('finish', (data) => {
                    let patient_location = { 'location_image': `location_${response.patientRequestsDetail._id}.png` }
                    PatientRequests.findOneAndUpdate({ _id: ObjectId(response.patientRequestsDetail._id) }, { $set: patient_location }, {new: true}).then(data =>{
                        res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));
                    }).catch(err => console.log(err))
                    resolve();
                })
                .on('error', (error) => {
                    let patient_location = { 'location_image': `location_${response.patientRequestsDetail._id}.png` }
                    PatientRequests.findOneAndUpdate({ _id: ObjectId(response.patientRequestsDetail._id) }, { $set: patient_location }, {new: true}).then(data =>{
                        res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));
                    }).catch(err => console.log(err))
                    reject(error);
                });
        }).then(()=> {
        })
        .catch((error) => {
            console.log(`Something happened: ${error}`);
        });
    })
}

exports.postAocRequestDetailUpdate = (req, res) => {
    let postAocRequestDetailUpdateCond = {
        '$and': [
            { _id: ObjectId(req.body.aoc_requests_id) },
            { 
                '$or': [
                    { request_status: { '$ne': "COMPLETED" } },
                    { request_status: { '$ne': "CANCELED" } },
                ]
            }
        ]
    };

    let aocRequestDetail = {};

    Object.keys(req.body).forEach(e=> {
        aocRequestDetail[e] = req.body[e];
    })

    delete aocRequestDetail['aoc_requests_id'];

    AocRequests.findOneAndUpdate(postAocRequestDetailUpdateCond, { $set: aocRequestDetail }, { new: true }).then((aoc_request) => {
        var response = {};
        if(aoc_request){
            response.aoc_request_detail = req.body;
            res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, resp, 'Aoc Request already completed or canceled.'));
        }
    })
};