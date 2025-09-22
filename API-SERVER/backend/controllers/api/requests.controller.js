const { redisClient } = require('../../server');

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
    var OngoingRequestListCondition = [
	    { '$match': {
                "$and": [
                    { "isactive": 1 },
                    { "isdeleted": false },
                    { "_id": ObjectId(req.body.user_id) }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'hospital_ids',
                'foreignField': '_id',
                'as': 'hospitalsDetail'
            }
        },
        { '$unwind': '$hospitalsDetail' },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'hospitalsDetail._id',
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
                as: "ambulancesDetail.aocRequestsDetail"
            }
        },
        { 
            '$unwind': "$ambulancesDetail.aocRequestsDetail"
        },
        {
            '$lookup': {
                'from': 'patient_monitors',
                'localField': 'ambulancesDetail.aocRequestsDetail.moniter_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail.aocRequestsDetail.patientMonitorsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patient_requests',
                'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail.patientRequestsDetail'
            }
        },
        { '$unwind': '$ambulancesDetail.patientRequestsDetail' },
        {
            '$lookup': {
                'from': 'drivers',
                'localField': 'ambulancesDetail.aocRequestsDetail.driver_ids',
                'foreignField': '_id',
                'as': 'ambulancesDetail.driversDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail.driversDetail",
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
                '_id': '$ambulancesDetail._id',
                'ambulance_box_code': { $first :'$ambulancesDetail.ambulance_box_code' },
                'name1': { $first : '$ambulancesDetail.name1' },
                'name2': { $first : '$ambulancesDetail.name2' },
                'is_online': { $first : '$ambulancesDetail.is_online' },
                'aocRequestsDetail':  { $first :'$ambulancesDetail.aocRequestsDetail' }, 
                'patientRequestsDetail':  { $first :'$ambulancesDetail.patientRequestsDetail' }, 
                'ambulanceTrackingsDetail':  { $first :'$ambulancesDetail.ambulanceTrackingsDetail' }, 
                'driversDetail':  { $first :'$ambulancesDetail.driversDetail' },
            }
        },
        {
            '$project': {
                '_id': 1,
                'name1': 1,
                'name2': 1,
                'is_online': 1,
                'ambulance_box_code': { $toInt: '$ambulance_box_code' },
                'aocRequestsDetail': {
                    '_id': 1,
                    'request_status': 1,
                    'request_type': 1,
                    
                    'patientMonitorsDetail' :{
                        '_id':1,
                        "name":1,
                        "serial_number": 1,
                        "is_online": 1,
                        "web_address": 1,
                        "web_port": 1,
                        "software_version": 1,
                        "hardware_version": 1,
                        "app_version": 1,
                        "type": 1,
                        "name": 1,
                        "isactive": 1,
                        "web_view_url": 1,
                        "web_view" : 1,
                        "rtmp_url": {
                            $cond: {
                                if: {
                                    "$eq": [
                                        "$aocRequestsDetail.patientMonitorsDetail.type" ,
                                        "JENNY"
                                    ]
                                },
                                then: { 
                                    $concat: [
                                        'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$aocRequestsDetail.patientMonitorsDetail.serial_number"}
                                    ]
                                },
                                else: ''
                        }},
                    },
                },
                'patientRequestsDetail': {
                    "severity_level":{ $toInt: '$patientRequestsDetail.severity_level'},
                    'severity_color_code': { $switch: {
                        branches: [
                            { case: {$eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 1]}, then: configure.severityColor._1 },
                            { case: {$eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 2]}, then: configure.severityColor._2 },
                            { case: {$eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 3]}, then: configure.severityColor._3 },
                            { case: {$eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 4]}, then: configure.severityColor._4 },
                            { case: {$eq: [{ $toInt: "$patientRequestsDetail.severity_level" }, 5]}, then: configure.severityColor._5 }, ],
                            default: configure.severityColor._1
                        }
                    }
                },
                "is_tracking_on": {
                    $cond: {
                        if: {
                            "$gt": [
                                { "$subtract": [ new Date(), 
                                    { $cond: [
                                        {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
                                        '$ambulanceTrackingsDetail.updatedAt',
                                        0
                                    ] } ] },
                                configure.AMB_TRAKCING_TIMEOUT
                            ]
                        },
                        then: 0,
                        else: 1
                    }
                },
                'ambulanceTrackingsDetail': {
                    '_id': 1,
                    'location': 1,
                    'heading': 1,
                    'speed': 1,
                    'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
                    "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
                    "estimated_time": { $toInt:"$ambulanceTrackingsDetail.estimated_time" },
                    "speed_color_code": { $switch: {
                        branches: [
                            { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: configure.speedColor.GT_120 },
                            { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.GT_80_LTE_120  },
                            { case: {$lte: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.LTE_80 } ],
                            default: configure.speedColor.LTE_80
                        }
                    }
                },
                'driversDetail': {
                    '_id': 1,
                    'first_name': 1,
                    'last_name': 1,
                    'gender': 1
                }
            }
        },
        {
            '$project': {
                '_id': 1,
                'name1': 1,
                'name2': 1,
                'is_online': 1,
                'ambulance_box_code': 1,
                'aocRequestsDetail': 1,
                'patientRequestsDetail': 1,
                'is_tracking_on': 1,
                'ambulanceTrackingsDetail': {
                    '_id': 1,
                    'location': 1,
                    'heading': 1,
                    'speed': 1,
                    'covered_distance': 1,
                    'estimated_speed': 1,
                    'estimated_time': 1,
                    'speed_color_code': { $switch: {
                        branches: [
                            { case: {$eq: [{ $toInt: "$is_tracking_on" }, 0]}, then: configure.trackingAssignColor.TR_0_ASN_1 }],
                            default: '$ambulanceTrackingsDetail.speed_color_code'
                        }
                    }
                },
                'driversDetail': 1
            }
        },
        {
            '$sort': { 'is_tracking_on': -1, 'ambulance_box_code': -1 }
        }
    ];
           
    AocUsers.aggregate(OngoingRequestListCondition)
    .then(data => {
        if(data.length){
            var resp = [{}];
            resp[0]['ambulancesDetail'] = data;
            res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
        }
        else 
            res.send(configure.apiResp(true, 200, [], { message: "Aoc Request not found."},req.headers.isencryption));
    })
    .catch(err => {
     res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
    });
}

exports.postOngoingRequestListt = (req, res) => {
    let resp = {};
    resp['ambulancesDetail'] = [];
    let respInd = 0;    

    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {
            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption)); return; }
            let ambulanceArr = data.split(',');
            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        // if((JSON.parse(data['is_tracking_on']) == 1) && (JSON.parse(data['is_assign']) == 1)){
                            resp['ambulancesDetail'][respInd] = {};
                            resp['ambulancesDetail'][respInd]['_id'] = ambulance_id;
                            resp['ambulancesDetail'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulancesDetail'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulancesDetail'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulancesDetail'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulancesDetail'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
    
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
    
                                let {_id, request_type, request_status, driversDetail, ambulance_assign_datetime} = data['aocRequestsDetail'];
    
                                resp['ambulancesDetail'][respInd]['aocRequestsDetail'] = {};
                                resp['ambulancesDetail'][respInd]['aocRequestsDetail']['_id'] = _id;
                                resp['ambulancesDetail'][respInd]['aocRequestsDetail']['request_type'] = request_type;
                                resp['ambulancesDetail'][respInd]['aocRequestsDetail']['request_status'] = request_status;
                                resp['ambulancesDetail'][respInd]['aocRequestsDetail']['ambulance_assign_datetime'] = ambulance_assign_datetime;
    
                                resp['ambulancesDetail'][respInd]['driversDetail'] = driversDetail;
    
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulancesDetail'][respInd]['aocRequestsDetail']['patientMonitorsDetail'] = data['aocRequestsDetail']['patientMonitorsDetail'];
                                    resp['ambulancesDetail'][respInd]['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url']?data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url']:'';
                                }
                                
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    let { severity_level, severity_color_code } = data['patientRequestsDetail'];
    
                                    resp['ambulancesDetail'][respInd]['patientRequestsDetail'] = {};
                                    resp['ambulancesDetail'][respInd]['patientRequestsDetail']['severity_level'] = severity_level;
                                    resp['ambulancesDetail'][respInd]['patientRequestsDetail']['severity_color_code'] = severity_color_code;
                                }
    
                                if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                    data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                    resp['ambulancesDetail'][respInd]['ambulanceTrackingsDetail'] = data['ambulanceTrackingsDetail'];
                                }
                            }
                            
                            respInd++;
                            console.log(ambulanceArr.length, (i+1));
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        // }  else {
                        //     if(ambulanceArr.length == (i+1)){
                        //         resolve(resp);
                        //     }
                        // }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
                })
            })
        })
    }).then((data)=> {
        console.log(data);
        if(data['ambulancesDetail'].length){
            data['ambulancesDetail'] = data['ambulancesDetail'].sort((i, j)=> {
                if(i['aocRequestsDetail'] && j['aocRequestsDetail']){
                    if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                        return 1;
                    }
                    if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                        return -1;
                    }
                    return 0;
                }else{
                    if ((i['ambulance_box_code']) < (j['ambulance_box_code'])) {
                        return 1;
                    }
                    if ((i['ambulance_box_code']) > (j['ambulance_box_code'])) {
                        return -1;
                    }
                    return 0;
                }
            })
            data['ambulancesDetail'] = data['ambulancesDetail'].sort((i, j)=> {
                if ((i.is_assign) < (j.is_assign)) {
                    return 1;
                } else if ((i.is_assign) > (j.is_assign)) {
                    return -1;
                }
                return 0;
            })
            data['ambulancesDetail'] = data['ambulancesDetail'].sort((i, j)=> {
                if ((i.is_tracking_on  + i.is_assign) < (j.is_tracking_on  + j.is_assign)) {
                    return 1;
                }
                if ((i.is_tracking_on  + i.is_assign) > (j.is_tracking_on  + j.is_assign)) {
                    return -1;
                }
                return 0;
            })
            res.send(configure.apiResp(true, 200, [data], '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

exports.postAocRequestDetailUpdate =(req,res)=>{

}

exports.postAocRequestDetail =(req,res)=>{
        
}

exports.postTrackHistory =(req,res)=>{
    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        res.send(configure.apiResp(false, 400, {}, errors.array()));
        return;
    }

    const condition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    { "isactive": 1 },
                    { "_id": ObjectId(req.body.ambulance_id) }
                ]
            }
        },
    ];

    AocRequests.aggregate(condition)
    .then((requests) => {
        var resp = {};
        if(requests.length){
            resp.request_detail = requests;
            res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
        } else {
            res.send(configure.apiResp(false, 1003, {}, 'Requests not found.',req.headers.isencryption));
        }
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Requests.", req.headers.isencryption));
    });    
}