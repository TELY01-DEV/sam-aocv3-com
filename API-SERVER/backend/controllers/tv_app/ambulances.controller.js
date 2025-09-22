const { redisClient } = require('../../server');

const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const { rejects } = require('assert');
const ObjectId = mongoose.Types.ObjectId;
const AmbulanceCrashes = db.ambulance_crashes;
const AocUsers = db.aoc_users;

exports.postRmtHosAmbulanceDetail =(req,res)=>{
    let resp = {};
    resp['ambulance_data'] = [];
    let respInd = 0;

    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {
            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption)); return; }
            let ambulanceArr = data.split(',');
            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        if((JSON.parse(data['is_tracking_on']) == 1 && JSON.parse(data['is_assign']) == 1) || JSON.parse(data['is_assign']) == 1 && JSON.parse(data['is_monitor_online']) == 1){
                            resp['ambulance_data'][respInd] = {};
                            resp['ambulance_data'][respInd]['_id'] = ambulance_id;
                            resp['ambulance_data'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulance_data'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulance_data'][respInd]['number'] = data['number'] ? JSON.parse(data['number']) : '';
                            resp['ambulance_data'][respInd]['ambulance_phone'] = data['ambulance_phone'] ? JSON.parse(data['ambulance_phone']) : '';
                            resp['ambulance_data'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulance_data'][respInd]['tracking_server_url'] = String(process.env.TRACKING_SERVER_URL) ? String(process.env.TRACKING_SERVER_URL) : '';
                            resp['ambulance_data'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
                            resp['ambulance_data'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulance_data'][respInd]['is_monitor_online'] = data['is_monitor_online'] ? JSON.parse(data['is_monitor_online']) : 0;
            
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
                                resp['ambulance_data'][respInd]['aocRequestsDetail'] = data['aocRequestsDetail'] ? data['aocRequestsDetail'] : {};
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulance_data'][respInd]['is_monitor_online'] = data['aocRequestsDetail']['patientMonitorsDetail']['is_online'] ? 1 : 0;
                                    data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] ? data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] : '';
                                }
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    resp['ambulance_data'][respInd]['aocRequestsDetail']['patientRequestsDetail'] = data['patientRequestsDetail'] ? data['patientRequestsDetail'] : {};
                                }
                            }

            
                            if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                if(data['ambulanceTrackingsDetail']['_id']){
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail'] = {};
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['_id'] = data['ambulanceTrackingsDetail']['_id'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['location'] = data['ambulanceTrackingsDetail']['location'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['heading'] = data['ambulanceTrackingsDetail']['heading'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed'] = data['ambulanceTrackingsDetail']['speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['covered_distance'] = data['ambulanceTrackingsDetail']['covered_distance'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_speed'] = data['ambulanceTrackingsDetail']['estimated_speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_time'] = data['ambulanceTrackingsDetail']['estimated_time'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed_color_code'] = data['ambulanceTrackingsDetail']['speed_color_code'];
                                }
                            }
            
                            if(data['ambulanceImagesDetail'] && data['ambulanceImagesDetail'] !== '') {
                                data['ambulanceImagesDetail'] = JSON.parse(data['ambulanceImagesDetail']);
                                if(data['ambulanceImagesDetail']['images'])
                                resp['ambulance_data'][respInd]['ambulanceImagesDetail'] = data['ambulanceImagesDetail']['images'];
                            }
                            
                            respInd++;
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        } else {
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
    
                })
            })
        })
    }).then((data)=> {

        if(data['ambulance_data'].length){
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return 1;
                }
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (i.is_monitor_online < j.is_monitor_online) {
                    return 1;
                }
                if (i.is_monitor_online > j.is_monitor_online) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_monitor_online  + i.is_tracking_on) < (j.is_monitor_online  + j.is_tracking_on)) {
                    return 1;
                }
                if ((i.is_monitor_online  + i.is_tracking_on) > (j.is_monitor_online  + j.is_tracking_on)) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_monitor_online  + i.is_assign  + i.is_tracking_on) < (j.is_monitor_online  + j.is_assign + j.is_tracking_on)) {
                    return 1;
                } else if ((i.is_monitor_online  + i.is_assign  + i.is_tracking_on) > (j.is_monitor_online  + j.is_assign + j.is_tracking_on)) {
                    return -1;
                } else {
                    if ((i.is_monitor_online  + i.is_tracking_on) < (j.is_monitor_online  + j.is_tracking_on)) {
                        return 1;
                    } else if ((i.is_monitor_online  + i.is_tracking_on) > (j.is_monitor_online  + j.is_tracking_on)){
                        return -1
                    } else {
                        return 0;
                    }
                }
            })
            data['ambulance_data'] = data['ambulance_data'].slice(0, 4);
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

// exports.postRmtHosAmbulanceDetail =(req,res)=>{

//     var getAmbulanceDetailCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "_id": ObjectId(req.body.user_id) },
//                     { "isdeleted": false },
//                     { "isactive": 1 },
//                 ]
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'hospital_ids',
//                 'foreignField': '_id',
//                 'as': 'hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "ambulances",
//                 let: {
//                     hospital_id: "$hospitalsDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$hospital_id",
//                                             "$$hospital_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isdeleted",
//                                             false
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isactive",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_types',
//                 'localField': 'ambulancesDetail.type_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.ambulanceTypesDetails'
//             }
//         },
//         { 
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTypesDetails",
//                 "preserveNullAndEmptyArrays": true
//             } 
//         },
//         {
//             $lookup: {
//                 from: "aoc_requests",
//                 let: {
//                     ambulance_id: "$ambulancesDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$ambulance_id",
//                                             "$$ambulance_id"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "COMPLETED"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "CANCELED"
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail",
//                 "preserveNullAndEmptyArrays": false
//             }
//         },
//         { 
//             "$sort": {
//                 "ambulancesDetail.aocRequestsDetail.createdAt": -1
//             } 
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
        
//         {
//             '$lookup': {
//                 'from': 'fast_tracks',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_requests',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'patients',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_monitors',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.moniter_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientMonitorsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_trackings',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceTrackingsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTrackingsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_images',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceImagesDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceImagesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$group': {
//                 '_id': '$ambulancesDetail._id',
//                 "ambulancesDetail" :{ $first: '$ambulancesDetail'},
//                 "name1": { $first: '$ambulancesDetail.name1' },
//                 "name2": { $first: '$ambulancesDetail.name2' },
//                 "number": { $first: '$ambulancesDetail.number' },
//                 "ambulance_phone": { $first: '$ambulancesDetail.ambulance_phone' },
//                 "ambulance_box_code": { $first: '$ambulancesDetail.ambulance_box_code' },
//                 "is_online": { $first: '$ambulancesDetail.is_online' },
//                 "aocRequestsDetail": { $first: '$ambulancesDetail.aocRequestsDetail' },
//                 "ambulanceTrackingsDetail": { $first: '$ambulancesDetail.ambulanceTrackingsDetail' },
//                 "ambulanceImagesDetail": { $first: '$ambulancesDetail.ambulanceImagesDetail' },
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
//                 "is_assign":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail._id', false]},
//                         1,
//                         0
//                     ]
//                 },
//                 "is_monitor_online":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail.patientMonitorsDetail.is_online', false]},
//                         '$aocRequestsDetail.patientMonitorsDetail.is_online',
//                         0
//                     ]
//                 },
//                 "aocRequestsDetail": {
//                     "_id": 1,
//                     "request_code": 1,
//                     "is_trauma": 1,
//                     "destination": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "source": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "request_status": {
//                         $cond: [
//                             {$ifNull: ['$aocRequestsDetail.request_status', false]},
//                             '$aocRequestsDetail.request_status',
//                             ''
//                         ]
//                     },
//                     "request_type" : "$aocRequestsDetail.request_type",
//                     "request_note": 1,
//                     "request_code": 1,
//                     "fastTracksDetail": {
//                         "_id": 1,
//                         "name": 1
//                     },
//                       "web_view_url":1,
                   
//                     "patientMonitorsDetail": {
//                         "_id": 1,
//                         "name": 1,
//                         "type": 1,
//                         "serial_number": 1,
//                         "web_address": 1,
//                         "web_port": 1,
//                         "web_view_url":1,
//                         "rtmp_url": {
//                             $cond: {
//                                 if: {
//                                     "$eq": [
//                                         "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail.type" ,
//                                         "JENNY"
//                                     ]
//                                 },
//                                 then: { 
//                                     $concat: [
//                                         'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                     ]
//                                 },
//                                 else: ''
//                         }},
//                         "web_view": 1,
//                         "web_port": 1,
//                         "is_online": { $cond: [
//                             {$ifNull: ['$aocRequestsDetail.patientMonitorsDetail.is_online', false]},
//                             { $toInt: '$aocRequestsDetail.patientMonitorsDetail.is_online'},
//                             0
//                         ] }
//                     },
//                     "patientRequestsDetail": {
//                         "_id": 1,
//                         "sickness_type": 1,
//                         "severity_level": 1,
//                         'severity_color_code': { $switch: {
//                             branches: [
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 1]}, then: configure.severityColor._1 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 2]}, then: configure.severityColor._2 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 3]}, then: configure.severityColor._3 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 4]}, then: configure.severityColor._4 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 5]}, then: configure.severityColor._5 }, ],
//                                 default: configure.severityColor._1
//                             }
//                         },
//                         "diagnosis_note": 1,
//                         "patientsDetail": {
//                             "_id": 1,
//                             "first_name": 1,
//                             "last_name": 1,
//                             "age": 1,
//                             "gender": 1
//                         },
//                     },
//                     "rtmp_url": "",
//                     // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
//                     "medicalEquipmentsDetail": {
//                         "_id": 1,
//                         "name":  1,
//                         "is_visible":  1,
//                         "picture":  1,
//                         "icon_image":  1
//                     },
//                 },
//                 "is_tracking_on": {
//                     $cond: {
//                         if: {
//                             "$gt": [
//                                 { "$subtract": [ new Date(), 
//                                     { $cond: [
//                                         {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
//                                         '$ambulanceTrackingsDetail.updatedAt',
//                                         0
//                                     ] } ] },
//                                 configure.AMB_TRAKCING_TIMEOUT
//                             ]
//                         },
//                         then: 0,
//                         else: 1
//                     }
//                 },
//                 "ambulanceTrackingsDetail": {
//                     $ifNull: [
//                     {
//                         "_id": "$ambulanceTrackingsDetail._id",
//                         "location": "$ambulanceTrackingsDetail.location",
//                         "heading": "$ambulanceTrackingsDetail.heading",
//                         "speed": "$ambulanceTrackingsDetail.speed",
//                         'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
//                         "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
//                         "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
//                         "speed_color_code": { $switch: {
//                             branches: [
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: configure.speedColor.GT_120 },
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.GT_80_LTE_120 },
//                                 { case: {$lte: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.LTE_80 } ],
//                                 default: configure.speedColor.LTE_80
//                             }
//                         }
//                     }, {}]
//                 },
//                 "ambulanceImagesDetail": {
//                     $ifNull: [ "$ambulanceImagesDetail.images", {}]
//                 },
//             }
//         },
//         {
//             '$match': {
//                 "$or": [
//                     { 
//                         "$and": [
//                             { "is_tracking_on": 1 },
//                             { "is_assign": 1 },
//                         ]
//                     },
//                     {
//                         "$and": [
//                             { "is_assign": 1 },
//                             { "is_monitor_online": 1 },
//                         ]
//                     }
//                 ]
//             }
//         },
//         {
//             '$project': {
//                 '_id': 1,
//                 'name1': 1,
//                 'name2': 1,
//                 'number': 1,
//                 'ambulance_phone': 1,
//                 'ambulance_box_code': 1,
//                 'tracking_server_url': 1,
//                 'is_assign': 1,
//                 'is_monitor_online': 1,
//                 'aocRequestsDetail': 1,
//                 'is_tracking_on': 1,
//                 'ambulanceTrackingsDetail': {
//                     '_id': 1,
//                     'location': 1,
//                     'heading': 1,
//                     'speed': 1,
//                     'covered_distance': 1,
//                     'estimated_speed': 1,
//                     'estimated_time': 1,
//                     'speed_color_code': { $switch: {
//                             branches: [
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 1]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 1]}
//                                         ]
//                                     }, then: '$ambulanceTrackingsDetail.speed_color_code'
//                                 },
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 1]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 0]}
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_1_ASN_0
//                                 },
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 0]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 1]}
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_0_ASN_1
//                                 }
//                             ],
//                             default: configure.trackingAssignColor.TR_0_ASN_1
//                         }
//                     }
//                 },
//                 'ambulanceImagesDetail': 1
//             }
//         },
//         {
//             '$sort': {
//                 'aocRequestsDetail.patientMonitorsDetail.is_online': -1,
//                 'is_assign': -1,
//                 'is_tracking_on': -1,
//                 'ambulance_box_code': -1
//             }
//         }
//     ];
   
//     AocUsers.aggregate(getAmbulanceDetailCondition)
//     .then((data) => {
//         var resp = {};
//         if (data.length) {
//             resp.ambulance_data = data;
//             res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
//         } else {
//             res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption));
//         }
//     })
//     .catch(err => {
//         res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
//     });
// }

exports.postEkgAmbulanceDetail =(req,res)=>{
    let resp = {};
    resp['ambulance_data'] = [];
    let respInd = 0;
    
    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {

            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption)); return; }

            let ambulanceArr = data.split(',');

            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        if((JSON.parse(data['is_tracking_on']) == 1 && JSON.parse(data['is_assign']) == 1) || JSON.parse(data['is_assign']) == 1 && JSON.parse(data['is_monitor_online']) == 1){
                            resp['ambulance_data'][respInd] = {};
                            resp['ambulance_data'][respInd]['_id'] = ambulance_id;
                            resp['ambulance_data'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulance_data'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulance_data'][respInd]['number'] = data['number'] ? JSON.parse(data['number']) : '';
                            resp['ambulance_data'][respInd]['ambulance_phone'] = data['ambulance_phone'] ? JSON.parse(data['ambulance_phone']) : '';
                            resp['ambulance_data'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulance_data'][respInd]['tracking_server_url'] = String(process.env.TRACKING_SERVER_URL) ? String(process.env.TRACKING_SERVER_URL) : '';
                            resp['ambulance_data'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
                            resp['ambulance_data'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulance_data'][respInd]['is_monitor_online'] = data['is_monitor_online'] ? JSON.parse(data['is_monitor_online']) : 0;
            
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
                                resp['ambulance_data'][respInd]['aocRequestsDetail'] = data['aocRequestsDetail'] ? data['aocRequestsDetail'] : {};
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulance_data'][respInd]['is_monitor_online'] = data['aocRequestsDetail']['patientMonitorsDetail']['is_online'] ? 1 : 0;
                                    data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] ? data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] : '';
                                }
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    resp['ambulance_data'][respInd]['aocRequestsDetail']['patientRequestsDetail']['severity_color_code'] = data['patientRequestsDetail']['severity_color_code'] ? data['patientRequestsDetail']['severity_color_code'] : '';
                                }
                            }

            
                            if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                if(data['ambulanceTrackingsDetail']['_id']){
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail'] = {};
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['_id'] = data['ambulanceTrackingsDetail']['_id'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['location'] = data['ambulanceTrackingsDetail']['location'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['heading'] = data['ambulanceTrackingsDetail']['heading'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed'] = data['ambulanceTrackingsDetail']['speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['covered_distance'] = data['ambulanceTrackingsDetail']['covered_distance'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_speed'] = data['ambulanceTrackingsDetail']['estimated_speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_time'] = data['ambulanceTrackingsDetail']['estimated_time'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed_color_code'] = data['ambulanceTrackingsDetail']['speed_color_code'];
                                }
                            }
            
                            if(data['ambulanceImagesDetail'] && data['ambulanceImagesDetail'] !== '') {
                                data['ambulanceImagesDetail'] = JSON.parse(data['ambulanceImagesDetail']);
                                if(data['ambulanceImagesDetail']['images'])
                                resp['ambulance_data'][respInd]['ambulanceImagesDetail'] = data['ambulanceImagesDetail']['images'];
                            }
                            
                            respInd++;
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        } else {
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
    
                })
            })
        })
    }).then((data)=> {

        if(data['ambulance_data'].length){
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return 1;
                }
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (i.is_monitor_online < j.is_monitor_online) {
                    return 1;
                }
                if (i.is_monitor_online > j.is_monitor_online) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_monitor_online  + i.is_tracking_on) < (j.is_monitor_online  + j.is_tracking_on)) {
                    return 1;
                }
                if ((i.is_monitor_online  + i.is_tracking_on) > (j.is_monitor_online  + j.is_tracking_on)) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_monitor_online  + i.is_assign  + i.is_tracking_on) < (j.is_monitor_online  + j.is_assign + j.is_tracking_on)) {
                    return 1;
                } else if ((i.is_monitor_online  + i.is_assign  + i.is_tracking_on) > (j.is_monitor_online  + j.is_assign + j.is_tracking_on)) {
                    return -1;
                } else {
                    if ((i.is_monitor_online  + i.is_tracking_on) < (j.is_monitor_online  + j.is_tracking_on)) {
                        return 1;
                    } else if ((i.is_monitor_online  + i.is_tracking_on) > (j.is_monitor_online  + j.is_tracking_on)){
                        return -1
                    } else {
                        return 0;
                    }
                }
            })
            data['ambulance_data'] = data['ambulance_data'].slice(0, 8);
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

// exports.postEkgAmbulanceDetail =(req,res)=>{
//     var getAmbulanceDetailCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "_id": ObjectId(req.body.user_id) },
//                     { "isdeleted": false },
//                     { "isactive": 1 },
//                 ]
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'hospital_ids',
//                 'foreignField': '_id',
//                 'as': 'hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "ambulances",
//                 let: {
//                     hospital_id: "$hospitalsDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$hospital_id",
//                                             "$$hospital_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isdeleted",
//                                             false
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isactive",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_types',
//                 'localField': 'ambulancesDetail.type_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.ambulanceTypesDetails'
//             }
//         },
//         { 
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTypesDetails",
//                 "preserveNullAndEmptyArrays": true
//             } 
//         },
//         {
//             $lookup: {
//                 from: "aoc_requests",
//                 let: {
//                     ambulance_id: "$ambulancesDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$ambulance_id",
//                                             "$$ambulance_id"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "COMPLETED"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "CANCELED"
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {"$sort": {"ambulancesDetail.aocRequestsDetail.createdAt": -1}},
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
        
//         {
//             '$lookup': {
//                 'from': 'fast_tracks',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_requests',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'patients',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_monitors',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.moniter_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientMonitorsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_trackings',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceTrackingsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTrackingsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_images',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceImagesDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceImagesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$group': {
//                 '_id': '$ambulancesDetail._id',
//                 "ambulancesDetail" :{ $first: '$ambulancesDetail'},
//                 "name1": { $first: '$ambulancesDetail.name1' },
//                 "name2": { $first: '$ambulancesDetail.name2' },
//                 "number": { $first: '$ambulancesDetail.number' },
//                 "ambulance_phone": { $first: '$ambulancesDetail.ambulance_phone' },
//                 "ambulance_box_code": { $first: '$ambulancesDetail.ambulance_box_code' },
//                 "is_online": { $first: '$ambulancesDetail.is_online' },
//                 "aocRequestsDetail": { $first: '$ambulancesDetail.aocRequestsDetail' },
//                 "ambulanceTrackingsDetail": { $first: '$ambulancesDetail.ambulanceTrackingsDetail' },
//                 "ambulanceImagesDetail": { $first: '$ambulancesDetail.ambulanceImagesDetail' },
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "is_monitor_online":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail.patientMonitorsDetail.is_online', false]},
//                         '$aocRequestsDetail.patientMonitorsDetail.is_online',
//                         0
//                     ]
//                 },
//                 "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
//                 "is_assign":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail._id', false]},
//                         1,
//                         0
//                     ]
//                 },
//                 "aocRequestsDetail": {
//                     "_id": 1,
//                     "request_code": 1,
//                     "is_trauma": 1,
//                     "destination": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "source": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "request_status": {
//                         $cond: [
//                             {$ifNull: ['$aocRequestsDetail.request_status', false]},
//                             '$aocRequestsDetail.request_status',
//                             ''
//                         ]
//                     },
//                     "request_type" : "$aocRequestsDetail.request_type",
//                     "request_note": 1,
//                     "request_code": 1,
//                     "fastTracksDetail": {
//                         "_id": 1,
//                         "name": 1
//                     },
               
//                     "patientMonitorsDetail": {
//                         "_id": 1,
//                         "name": 1,
//                         "type": 1,
//                         "serial_number": 1,
//                         "web_address": 1,
//                         "web_port": 1,
//                         "web_port": 1,
//                         "web_view_url": 1,
//                         "rtmp_url": {
//                             $cond: {
//                                 if: {
//                                     "$eq": [
//                                         "$aocRequestsDetail.patientMonitorsDetail.type" ,
//                                         "JENNY"
//                                     ]
//                                 },
//                                 then: { 
//                                     $concat: [
//                                         'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                     ]
//                                 },
//                                 else: ''
//                         }},
//                         "web_view": 1,
//                         "is_online": { $cond: [
//                             {$ifNull: ['$aocRequestsDetail.patientMonitorsDetail.is_online', false]},
//                             { $toInt: '$aocRequestsDetail.patientMonitorsDetail.is_online'},
//                             0
//                         ] }
//                     },
                    
//                     "patientRequestsDetail": {
//                         "_id": 1,
//                         "sickness_type": 1,
//                         "severity_level": 1,
//                         'severity_color_code': { $switch: {
//                             branches: [
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 1]}, then: configure.severityColor._1 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 2]}, then: configure.severityColor._2 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 3]}, then: configure.severityColor._3 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 4]}, then: configure.severityColor._4 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 5]}, then: configure.severityColor._5 }, ],
//                                 default: configure.severityColor._1
//                             }
//                         },
//                         "diagnosis_note": 1,
//                         "patientsDetail": {
//                             "_id": 1,
//                             "first_name": 1,
//                             "last_name": 1,
//                             "age": 1,
//                             "gender": 1
//                         },
//                     },
//                     "rtmp_url": "",
//                     // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
//                     "medicalEquipmentsDetail": {
//                         "_id": 1,
//                         "name":  1,
//                         "is_visible":  1,
//                         "picture":  1,
//                         "icon_image":  1
//                     },
//                 },
//                 "is_tracking_on": {
//                     $cond: {
//                         if: {
//                             "$gt": [
//                                 { "$subtract": [ new Date(), 
//                                     { $cond: [
//                                         {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
//                                         '$ambulanceTrackingsDetail.updatedAt',
//                                         0
//                                     ] } ] },
//                                 configure.AMB_TRAKCING_TIMEOUT
//                             ]
//                         },
//                         then: 0,
//                         else: 1
//                     }
//                 },
//                 "ambulanceTrackingsDetail": {
//                     $ifNull: [
//                     {
//                         "_id": "$ambulanceTrackingsDetail._id",
//                         "location": "$ambulanceTrackingsDetail.location",
//                         "heading": "$ambulanceTrackingsDetail.heading",
//                         "speed": "$ambulanceTrackingsDetail.speed",
//                         'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
//                         "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
//                         "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
//                         "speed_color_code": { $switch: {
//                             branches: [
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: configure.speedColor.GT_120 },
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.GT_80_LTE_120 },
//                                 { case: {$lte: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.LTE_80 } ],
//                                 default: configure.speedColor.LTE_80
//                             }
//                         }
//                     }, {}]
//                 },
//                 "ambulanceImagesDetail": {
//                     $ifNull: [ "$ambulanceImagesDetail.images", {}]
//                 },
//             }
//         },
//         {
//             '$match': {
//                 "$or": [
//                     { 
//                         "$and": [
//                             { "is_tracking_on": 1 },
//                             { "is_assign": 1 },
//                         ]
//                     },
//                     {
//                         "$and": [
//                             { "is_assign": 1 },
//                             { "is_monitor_online": 1 },
//                         ]
//                     }
//                 ]
//             }
//         },
//         {
//             '$project': {
//                 '_id': 1,
//                 'name1': 1,
//                 'name2': 1,
//                 'number': 1,
//                 'ambulance_phone': 1,
//                 'ambulance_box_code': 1,
//                 'tracking_server_url': 1,
//                 'is_monitor_online': 1,
//                 'is_assign': 1,
//                 'aocRequestsDetail': 1,
//                 'is_tracking_on': 1,
//                 'ambulanceTrackingsDetail': {
//                     '_id': 1,
//                     'location': 1,
//                     'heading': 1,
//                     'speed': 1,
//                     'covered_distance': 1,
//                     'estimated_speed': 1,
//                     'estimated_time': 1,
//                     'speed_color_code': { $switch: {
//                             branches: [
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 1]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 1]}
//                                         ]
//                                     }, then: '$ambulanceTrackingsDetail.speed_color_code'
//                                 },
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 1]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 0]}
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_1_ASN_0
//                                 },
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 0]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 1]}
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_0_ASN_1
//                                 }
//                             ],
//                             default: configure.trackingAssignColor.TR_0_ASN_1
//                         }
//                     }
//                 },
//                 'ambulanceImagesDetail': 1
//             }
//         },
//         {
//             '$sort': {
//                 'aocRequestsDetail.patientMonitorsDetail.is_online': -1,
//                 'is_assign': -1,
//                 'is_tracking_on': -1,
//                 'ambulance_box_code': -1
//             }
//         }
//     ];
   
//     AocUsers.aggregate(getAmbulanceDetailCondition)
//     .then((data) => {
//         var resp = {};
//         if (data.length) {
//             resp.ambulance_data = data;
//             res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
//         } else {
//             res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption));
//         }
//     })
//     .catch(err => {
//         res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
//     });
// }

// exports.postErAmbulanceDetail =(req,res)=>{
//     var getAmbulanceDetailCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "_id": ObjectId(req.body.user_id) },
//                     { "isdeleted": false },
//                     { "isactive": 1 },
//                 ]
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'hospital_ids',
//                 'foreignField': '_id',
//                 'as': 'hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "ambulances",
//                 let: {
//                     hospital_id: "$hospitalsDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$hospital_id",
//                                             "$$hospital_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isdeleted",
//                                             false
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isactive",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail",
//                 "preserveNullAndEmptyArrays": false
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_types',
//                 'localField': 'ambulancesDetail.type_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.ambulanceTypesDetails'
//             }
//         },
//         { 
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTypesDetails",
//                 "preserveNullAndEmptyArrays": true
//             } 
//         },
//         {
//             $lookup: {
//                 from: "aoc_requests",
//                 let: {
//                     ambulance_id: "$ambulancesDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$ambulance_id",
//                                             "$$ambulance_id"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "COMPLETED"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "CANCELED"
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {"$sort": {"ambulancesDetail.aocRequestsDetail.createdAt": -1}},
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
        
//         {
//             '$lookup': {
//                 'from': 'fast_tracks',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_requests',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'patients',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_monitors',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.moniter_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientMonitorsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_trackings',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceTrackingsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTrackingsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_images',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceImagesDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceImagesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$group': {
//                 '_id': '$ambulancesDetail._id',
//                 "ambulancesDetail" :{ $first: '$ambulancesDetail'},
//                 "name1": { $first: '$ambulancesDetail.name1' },
//                 "name2": { $first: '$ambulancesDetail.name2' },
//                 "number": { $first: '$ambulancesDetail.number' },
//                 "ambulance_phone": { $first: '$ambulancesDetail.ambulance_phone' },
//                 "ambulance_box_code": { $first: '$ambulancesDetail.ambulance_box_code' },
//                 "is_online": { $first: '$ambulancesDetail.is_online' },
//                 "aocRequestsDetail": { $first: '$ambulancesDetail.aocRequestsDetail' },
//                 "ambulanceTrackingsDetail": { $first: '$ambulancesDetail.ambulanceTrackingsDetail' },
//                 "ambulanceImagesDetail": { $first: '$ambulancesDetail.ambulanceImagesDetail' },
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
//                 "is_assign":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail._id', false]},
//                         1,
//                         0
//                     ]
//                 },
//                 "aocRequestsDetail": {
//                     "_id": 1,
//                     "request_code": 1,
//                     "is_trauma": 1,
//                     "destination": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "source": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "request_status": {
//                         $cond: [
//                             {$ifNull: ['$aocRequestsDetail.request_status', false]},
//                             '$aocRequestsDetail.request_status',
//                             ''
//                         ]
//                     },
//                     "request_type" : "$aocRequestsDetail.request_type",
//                     "request_note": 1,
//                     "request_code": 1,
//                     "fastTracksDetail": {
//                         "_id": 1,
//                         "name": 1
//                     },
           
//                     "patientMonitorsDetail": {
//                         "_id": 1,
//                         "name": 1,
//                         "type": 1,
//                         "serial_number": 1,
//                         "web_address": 1,
//                         "web_port": 1,
//                         "is_online": 1,
//                         "web_view_url": 1,
//                         "rtmp_url": {
//                             $cond: {
//                                 if: {
//                                     "$eq": [
//                                         "$aocRequestsDetail.patientMonitorsDetail.type" ,
//                                         "JENNY"
//                                     ]
//                                 },
//                                 then: { 
//                                     $concat: [
//                                         'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                     ]
//                                 },
//                                 else: ''
//                         }},
//                     },
//                     "patientRequestsDetail": {
//                         "_id": 1,
//                         "sickness_type": 1,
//                         "severity_level": 1,
//                         "severity_color_code": { $switch: {
//                             branches: [
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 1]}, then: configure.severityColor._1 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 2]}, then: configure.severityColor._2 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 3]}, then: configure.severityColor._3 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 4]}, then: configure.severityColor._4 },
//                                 { case: {$eq: [{ $toInt: "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" }, 5]}, then: configure.severityColor._5 }, ],
//                                 default: configure.severityColor._1
//                             }
//                         },
//                         "diagnosis_note": 1,
//                         "patientsDetail": {
//                             "_id": 1,
//                             "first_name": 1,
//                             "last_name": 1,
//                             "age": 1,
//                             "gender": 1
//                         },
//                     },
//                     "rtmp_url": "",
//                     // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
//                     "medicalEquipmentsDetail": {
//                         "_id": 1,
//                         "name":  1,
//                         "is_visible":  1,
//                         "picture":  1,
//                         "icon_image":  1
//                     },
//                 },
//                 "is_tracking_on": {
//                     $cond: {
//                         if: {
//                             "$gt": [
//                                 { "$subtract": [ new Date(), 
//                                     { $cond: [
//                                         {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
//                                         '$ambulanceTrackingsDetail.updatedAt',
//                                         0
//                                     ] } ] },
//                                 configure.AMB_TRAKCING_TIMEOUT
//                             ]
//                         },
//                         then: 0,
//                         else: 1
//                     }
//                 },
//                 "ambulanceTrackingsDetail": {
//                     $ifNull: [
//                     {
//                         "_id": "$ambulanceTrackingsDetail._id",
//                         "location": "$ambulanceTrackingsDetail.location",
//                         "heading": "$ambulanceTrackingsDetail.heading",
//                         "speed": "$ambulanceTrackingsDetail.speed",
//                         'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
//                         "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
//                         "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
//                         "speed_color_code": { $switch: {
//                             branches: [
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: 'F82427' },
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: 'E7622A' },
//                                 { case: {$lt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: '20C00C' } ],
//                                 default: '20C00C'
//                             }
//                         }
//                     }, {}]
//                 },
//                 "ambulanceImagesDetail": {
//                     $ifNull: [ "$ambulanceImagesDetail.images", {}]
//                 },
//             }
//         },
//         {
//             '$match': {
//                 "$and": [
//                     { "is_tracking_on": 1 },
//                     { "is_assign": 1 },
//                 ]
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "tracking_server_url": 1,
//                 "is_assign":  1,
//                 "aocRequestsDetail": 1,
//                 "is_tracking_on": 1,
//                 "ambulanceTrackingsDetail": {
//                     "_id": "$ambulanceTrackingsDetail._id",
//                     "location": "$ambulanceTrackingsDetail.location",
//                     "heading": "$ambulanceTrackingsDetail.heading",
//                     "speed": "$ambulanceTrackingsDetail.speed",
//                     'covered_distance': "$ambulanceTrackingsDetail.covered_distance",
//                     "estimated_speed": "$ambulanceTrackingsDetail.speed",
//                     "estimated_time": "$ambulanceTrackingsDetail.estimated_time",
//                     "speed_color_code":{
//                         $switch: {
//                             branches: [
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 1] }
//                                         ]
//                                     }, then: '$ambulanceTrackingsDetail.speed_color_code'
//                                 },
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 0] }
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_1_ASN_0
//                                 },
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 0] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 1] }
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_0_ASN_1
//                                 }
//                             ],
//                             default: configure.trackingAssignColor.TR_0_ASN_1
//                         }
//                     }
//                 },
//                 "ambulanceImagesDetail": 1,
//             }
//         },
//     ];
   
//     AocUsers.aggregate(getAmbulanceDetailCondition)
//     .then((data) => {
//         var resp = {};
//         if (data.length) {
//             resp.ambulance_data = data;
//             res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
//         } else {
//             res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption));
//         }
//     })
//     .catch(err => {
//         res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
//     });
// }

exports.postErAmbulanceDetail =(req,res)=>{
    let resp = {};
    resp['ambulance_data'] = [];
    let respInd = 0;

    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {
            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption)); return; }

            let ambulanceArr = data.split(',');
            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        if(JSON.parse(data['is_tracking_on']) == 1 && JSON.parse(data['is_assign'])){
                            
                            resp['ambulance_data'][respInd] = {};
                            resp['ambulance_data'][respInd]['_id'] = ambulance_id;
                            resp['ambulance_data'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulance_data'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulance_data'][respInd]['number'] = data['number'] ? JSON.parse(data['number']) : '';
                            resp['ambulance_data'][respInd]['ambulance_phone'] = data['ambulance_phone'] ? JSON.parse(data['ambulance_phone']) : '';
                            resp['ambulance_data'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulance_data'][respInd]['tracking_server_url'] = String(process.env.TRACKING_SERVER_URL) ? String(process.env.TRACKING_SERVER_URL) : '';
                            resp['ambulance_data'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
                            resp['ambulance_data'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulance_data'][respInd]['is_monitor_online'] = data['is_monitor_online'] ? JSON.parse(data['is_monitor_online']) : 0;
            
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
                                resp['ambulance_data'][respInd]['aocRequestsDetail'] = data['aocRequestsDetail'] ? data['aocRequestsDetail'] : {};
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulance_data'][respInd]['is_monitor_online'] = data['aocRequestsDetail']['patientMonitorsDetail']['is_online'] ? 1 : 0;
                                    data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] ? data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] : '';
                                }
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    resp['ambulance_data'][respInd]['aocRequestsDetail']['patientRequestsDetail']['severity_color_code'] = data['patientRequestsDetail']['severity_color_code'] ? data['patientRequestsDetail']['severity_color_code'] : '';
                                }
                            }

            
                            if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                if(data['ambulanceTrackingsDetail']['_id']){
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail'] = {};
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['_id'] = data['ambulanceTrackingsDetail']['_id'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['location'] = data['ambulanceTrackingsDetail']['location'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['heading'] = data['ambulanceTrackingsDetail']['heading'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed'] = data['ambulanceTrackingsDetail']['speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['covered_distance'] = data['ambulanceTrackingsDetail']['covered_distance'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_speed'] = data['ambulanceTrackingsDetail']['estimated_speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_time'] = data['ambulanceTrackingsDetail']['estimated_time'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed_color_code'] = data['ambulanceTrackingsDetail']['speed_color_code'];
                                }
                            }
            
                            if(data['ambulanceImagesDetail'] && data['ambulanceImagesDetail'] !== '') {
                                data['ambulanceImagesDetail'] = JSON.parse(data['ambulanceImagesDetail']);
                                if(data['ambulanceImagesDetail']['images'])
                                resp['ambulance_data'][respInd]['ambulanceImagesDetail'] = data['ambulanceImagesDetail']['images'];
                            }
                            
                            respInd++;
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        
                        } else {
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
                })
            })
        })
    }).then((data)=> {
        if(data['ambulance_data'].length){
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if(i['aocRequestsDetail'] && j['aocRequestsDetail']){
                    if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                        return 1;
                    }
                    if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                        return -1;
                    }
                    return 0;
                }
            })
            // data['ambulance_data'] = data['ambulance_data'].slice(0, 20);
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

exports.postCccAmbulanceDetail =(req,res)=>{
    let resp = {};
    resp['ambulance_data'] = [];
    let respInd = 0;

    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {
            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption)); return; }

            let ambulanceArr = data.split(',');
            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        if(JSON.parse(data['is_tracking_on']) == 1){
                            
                            resp['ambulance_data'][respInd] = {};
                            resp['ambulance_data'][respInd]['_id'] = ambulance_id;
                            resp['ambulance_data'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulance_data'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulance_data'][respInd]['number'] = data['number'] ? JSON.parse(data['number']) : '';
                            resp['ambulance_data'][respInd]['ambulance_phone'] = data['ambulance_phone'] ? JSON.parse(data['ambulance_phone']) : '';
                            resp['ambulance_data'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulance_data'][respInd]['tracking_server_url'] = String(process.env.TRACKING_SERVER_URL) ? String(process.env.TRACKING_SERVER_URL) : '';
                            resp['ambulance_data'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
                            resp['ambulance_data'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulance_data'][respInd]['is_monitor_online'] = data['is_monitor_online'] ? JSON.parse(data['is_monitor_online']) : 0;
            
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
                                resp['ambulance_data'][respInd]['aocRequestsDetail'] = data['aocRequestsDetail'] ? data['aocRequestsDetail'] : {};
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulance_data'][respInd]['is_monitor_online'] = data['aocRequestsDetail']['patientMonitorsDetail']['is_online'] ? 1 : 0;
                                    data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] ? data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] : '';
                                }
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    resp['ambulance_data'][respInd]['aocRequestsDetail']['patientRequestsDetail']['severity_color_code'] = data['patientRequestsDetail']['severity_color_code'] ? data['patientRequestsDetail']['severity_color_code'] : '';
                                }
                            }

            
                            if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                if(data['ambulanceTrackingsDetail']['_id']){
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail'] = {};
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['_id'] = data['ambulanceTrackingsDetail']['_id'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['location'] = data['ambulanceTrackingsDetail']['location'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['heading'] = data['ambulanceTrackingsDetail']['heading'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed'] = data['ambulanceTrackingsDetail']['speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['covered_distance'] = data['ambulanceTrackingsDetail']['covered_distance'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_speed'] = data['ambulanceTrackingsDetail']['estimated_speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_time'] = data['ambulanceTrackingsDetail']['estimated_time'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed_color_code'] = data['ambulanceTrackingsDetail']['speed_color_code'];
                                }
                            }
            
                            if(data['ambulanceImagesDetail'] && data['ambulanceImagesDetail'] !== '') {
                                data['ambulanceImagesDetail'] = JSON.parse(data['ambulanceImagesDetail']);
                                if(data['ambulanceImagesDetail']['images'])
                                resp['ambulance_data'][respInd]['ambulanceImagesDetail'] = data['ambulanceImagesDetail']['images'];
                            }
                            
                            respInd++;
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        
                        } else {
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
                })
            })
        })
    }).then((data)=> {
        if(data['ambulance_data'].length){
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if(i['aocRequestsDetail'] && j['aocRequestsDetail']){
                    if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                        return 1;
                    }
                    if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                        return -1;
                    }
                    return 0;
                }
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (i.is_assign < j.is_assign) {
                    return 1;
                }
                if (i.is_assign > j.is_assign) {
                    return -1;
                }
                return 0;
            })
            // data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
            //     if ((i.is_monitor_online  + i.is_assign) < (j.is_monitor_online  + j.is_assign)) {
            //         return 1;
            //     }
            //     if ((i.is_monitor_online  + i.is_assign) > (j.is_monitor_online  + j.is_assign)) {
            //         return -1;
            //     }
            //     return 0;
            // })
            // data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
            //     if ((i.is_monitor_online  + i.is_assign  + i.is_tracking_on) < (j.is_monitor_online  + j.is_assign + j.is_tracking_on)) {
            //         return 1;
            //     } else if ((i.is_monitor_online  + i.is_assign  + i.is_tracking_on) > (j.is_monitor_online  + j.is_assign + j.is_tracking_on)) {
            //         return -1;
            //     } else {
            //         if ((i.is_monitor_online  + i.is_assign) < (j.is_monitor_online  + j.is_assign)) {
            //             return 1;
            //         } else if ((i.is_monitor_online  + i.is_assign) > (j.is_monitor_online  + j.is_assign)){
            //             return -1
            //         } else {
            //             return 0;
            //         }
            //     }
            // })
            data['ambulance_data'] = data['ambulance_data'].slice(0, 20);
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

// exports.postCccAmbulanceDetail =(req,res)=>{
//     var getAmbulanceDetailCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "_id": ObjectId(req.body.user_id) },
//                     { "isdeleted": false },
//                     { "isactive": 1 },
//                 ]
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'hospital_ids',
//                 'foreignField': '_id',
//                 'as': 'hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "ambulances",
//                 let: {
//                     hospital_id: "$hospitalsDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$hospital_id",
//                                             "$$hospital_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isdeleted",
//                                             false
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isactive",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_types',
//                 'localField': 'ambulancesDetail.type_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.ambulanceTypesDetails'
//             }
//         },
//         { 
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTypesDetails",
//                 "preserveNullAndEmptyArrays": true
//             } 
//         },
//         {
//             $lookup: {
//                 from: "aoc_requests",
//                 let: {
//                     ambulance_id: "$ambulancesDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$ambulance_id",
//                                             "$$ambulance_id"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "COMPLETED"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "CANCELED"
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {"$sort": {"ambulancesDetail.aocRequestsDetail.createdAt": -1}},
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
        
//         {
//             '$lookup': {
//                 'from': 'fast_tracks',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_requests',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'patients',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_monitors',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.moniter_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientMonitorsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_trackings',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceTrackingsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTrackingsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_images',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceImagesDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceImagesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$group': {
//                 '_id': '$ambulancesDetail._id',
//                 "ambulancesDetail" :{ $first: '$ambulancesDetail'},
//                 "name1": { $first: '$ambulancesDetail.name1' },
//                 "name2": { $first: '$ambulancesDetail.name2' },
//                 "number": { $first: '$ambulancesDetail.number' },
//                 "ambulance_phone": { $first: '$ambulancesDetail.ambulance_phone' },
//                 "ambulance_box_code": { $first: '$ambulancesDetail.ambulance_box_code' },
//                 "is_online": { $first: '$ambulancesDetail.is_online' },
//                 "aocRequestsDetail": { $first: '$ambulancesDetail.aocRequestsDetail' },
//                 "ambulanceTrackingsDetail": { $first: '$ambulancesDetail.ambulanceTrackingsDetail' },
//                 "ambulanceImagesDetail": { $first: '$ambulancesDetail.ambulanceImagesDetail' },
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": { $toInt: "$ambulance_box_code" },
//                 "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
//                 "is_assign":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail._id', false]},
//                         1,
//                         0
//                     ]
//                 },
//                 "aocRequestsDetail": {
//                     "_id": 1,
//                     "request_code": 1,
//                     "is_trauma": 1,
//                     "destination": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "source": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "request_status": {
//                         $cond: [
//                             {$ifNull: ['$aocRequestsDetail.request_status', false]},
//                             '$aocRequestsDetail.request_status',
//                             ''
//                         ]
//                     },
//                     "request_type" : "$aocRequestsDetail.request_type",
//                     "request_note": 1,
//                     "request_code": 1,
//                     "fastTracksDetail": {
//                         "_id": 1,
//                         "name": 1
//                     },
//                     "web_view_url": {
//                         $cond: [
//                             { $ifNull: ["$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail._id", false] },
//                             { 
//                                 $concat: [
//                                     String(process.env.MONITER_STREAMING_SERVER_URL),  {$toString : "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                 ]
//                             },
//                             ''
//                         ]
//                     },
//                     "rtmp_url": {
//                         $cond: [
//                             { $ifNull: ["$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail._id", false] },
//                             { 
//                                 $concat: [
//                                     'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                 ]
//                             },
//                             ''
//                         ]
//                     },
//                     "patientMonitorsDetail": {
//                         "_id": 1,
//                         "name": 1,
//                         "type": 1,
//                         "serial_number": 1,
//                         "web_address": 1,
//                         "web_port": 1,
//                         "is_online": 1,
//                     },
//                     "patientRequestsDetail": {
//                         "_id": 1,
//                         "sickness_type": 1,
//                         "severity_level": 1,
//                         "severity_color_code": { $switch: {
//                             branches: [
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level", 1]}, then: configure.severityColor._1 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level", 2]}, then: configure.severityColor._2 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level", 3]}, then: configure.severityColor._3 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level", 4]}, then: configure.severityColor._4 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level", 5]}, then: configure.severityColor._5 }, ],
//                                 default: configure.severityColor._1
//                             }
//                         },
//                         "diagnosis_note": 1,
//                         "patientsDetail": {
//                             "_id": 1,
//                             "first_name": 1,
//                             "last_name": 1,
//                             "age": 1,
//                             "gender": 1
//                         },
//                     },
//                     "rtmp_url": "",
//                     // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
//                     "medicalEquipmentsDetail": {
//                         "_id": 1,
//                         "name":  1,
//                         "is_visible":  1,
//                         "picture":  1,
//                         "icon_image":  1
//                     },
//                 },
//                 "is_tracking_on": {
//                     $cond: {
//                         if: {
//                             "$gt": [
//                                 { "$subtract": [ new Date(), 
//                                     { $cond: [
//                                         {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
//                                         '$ambulanceTrackingsDetail.updatedAt',
//                                         0
//                                     ] } ] },
//                                 configure.AMB_TRAKCING_TIMEOUT
//                             ]
//                         },
//                         then: 0,
//                         else: 1
//                     }
//                 },
//                 "ambulanceTrackingsDetail": {
//                     $ifNull: [
//                     {
//                         "_id": "$ambulanceTrackingsDetail._id",
//                         "location": "$ambulanceTrackingsDetail.location",
//                         "heading": "$ambulanceTrackingsDetail.heading",
//                         "speed": "$ambulanceTrackingsDetail.speed",
//                         'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
//                         "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
//                         "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
//                         "speed_color_code": { $switch: {
//                             branches: [
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: 'F82427' },
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: 'E7622A' },
//                                 { case: {$lt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: '20C00C' } ],
//                                 default: '20C00C'
//                             }
//                         }
//                     }, {}]
//                 },
//                 "ambulanceImagesDetail": {
//                     $ifNull: [ "$ambulanceImagesDetail.images", {}]
//                 },
//             }
//         },
//         {
//             '$match': {
//                 "$or": [
//                     { "is_tracking_on": 1 },
//                     // { "is_assign": 1 },
//                 ]
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "tracking_server_url": 1,
//                 "is_assign":  1,
//                 "aocRequestsDetail": 1,
//                 "is_tracking_on": 1,
//                 "ambulanceTrackingsDetail": {
//                     "_id":  "$ambulanceTrackingsDetail._id",
//                     "location": "$ambulanceTrackingsDetail.location",
//                     "heading": "$ambulanceTrackingsDetail.heading",
//                     "speed": "$ambulanceTrackingsDetail.speed",
//                     'covered_distance': "$ambulanceTrackingsDetail.covered_distance",
//                     "estimated_speed": "$ambulanceTrackingsDetail.estimated_speed",
//                     "estimated_time": "$ambulanceTrackingsDetail.estimated_time",
//                     "speed_color_code": {
//                         $switch: {
//                             branches: [
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 1] }
//                                         ]
//                                     }, then: '$ambulanceTrackingsDetail.speed_color_code'
//                                 },
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 0] }
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_1_ASN_0
//                                 },
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 0] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 1] }
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_0_ASN_1
//                                 }
//                             ],
//                             default: configure.trackingAssignColor.TR_0_ASN_1
//                         }
//                     },
//                 },
//                 "ambulanceImagesDetail": 1,
//             }
//         },
//         {
//             '$sort': {
//                 'is_tracking_on': -1,
//                 'is_assign': -1,
//                 'ambulance_box_code': -1
//             }
//         }
//     ];
   
//     AocUsers.aggregate(getAmbulanceDetailCondition)
//     .then((data) => {
//         var resp = {};
//         if (data.length) {
//             resp.ambulance_data = data;
//             res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
//         } else {
//             res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption));
//         }
//     })
//     .catch(err => {
//         res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
//     });
// }

exports.postAocTvAmbulanceDetail =(req,res)=>{
    let resp = {};
    resp['ambulance_data'] = [];
    let respInd = 0;

    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {
            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.', req.headers.isencryption)); return; }

            let ambulanceArr = data.split(',');
            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        if(JSON.parse(data['is_tracking_on']) == 1 && JSON.parse(data['is_assign']) == 1){
                            resp['ambulance_data'][respInd] = {};
                            resp['ambulance_data'][respInd]['_id'] = ambulance_id;
                            resp['ambulance_data'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulance_data'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulance_data'][respInd]['number'] = data['number'] ? JSON.parse(data['number']) : '';
                            resp['ambulance_data'][respInd]['ambulance_phone'] = data['ambulance_phone'] ? JSON.parse(data['ambulance_phone']) : '';
                            resp['ambulance_data'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulance_data'][respInd]['tracking_server_url'] = String(process.env.TRACKING_SERVER_URL) ? String(process.env.TRACKING_SERVER_URL) : '';
                            resp['ambulance_data'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
                            resp['ambulance_data'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulance_data'][respInd]['is_monitor_online'] = data['is_monitor_online'] ? JSON.parse(data['is_monitor_online']) : 0;
            
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
                                resp['ambulance_data'][respInd]['aocRequestsDetail'] = data['aocRequestsDetail'] ? data['aocRequestsDetail'] : {};
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulance_data'][respInd]['is_monitor_online'] = data['aocRequestsDetail']['patientMonitorsDetail']['is_online'] ? 1 : 0;
                                    data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] ? data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] : '';
                                }
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    resp['ambulance_data'][respInd]['aocRequestsDetail']['patientRequestsDetail']['severity_color_code'] = data['patientRequestsDetail']['severity_color_code'] ? data['patientRequestsDetail']['severity_color_code'] : '';
                                }
                            }

            
                            if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                if(data['ambulanceTrackingsDetail']['_id']){
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail'] = {};
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['_id'] = data['ambulanceTrackingsDetail']['_id'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['location'] = data['ambulanceTrackingsDetail']['location'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['heading'] = data['ambulanceTrackingsDetail']['heading'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed'] = data['ambulanceTrackingsDetail']['speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['covered_distance'] = data['ambulanceTrackingsDetail']['covered_distance'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_speed'] = data['ambulanceTrackingsDetail']['estimated_speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_time'] = data['ambulanceTrackingsDetail']['estimated_time'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed_color_code'] = data['ambulanceTrackingsDetail']['speed_color_code'];
                                }
                            }
            
                            if(data['ambulanceImagesDetail'] && data['ambulanceImagesDetail'] !== '') {
                                data['ambulanceImagesDetail'] = JSON.parse(data['ambulanceImagesDetail']);
                                if(data['ambulanceImagesDetail']['images'])
                                resp['ambulance_data'][respInd]['ambulanceImagesDetail'] = data['ambulanceImagesDetail']['images'];
                            }
                            
                            respInd++;
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        } else {
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
    
                })
            })
        })
    }).then((data)=> {

        if(data['ambulance_data'].length){
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return 1;
                }
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return -1;
                }
                return 0;
            })
           
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_assign) < (j.is_assign)) {
                    return 1;
                }
                if ((i.is_assign) > (j.is_assign)) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_assign  + i.is_tracking_on) < (j.is_assign + j.is_tracking_on)) {
                    return 1;
                } else if ((i.is_assign  + i.is_tracking_on) > (j.is_assign + j.is_tracking_on)) {
                    return -1;
                } 
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].slice(0, 8);
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

// exports.postAocTvAmbulanceDetail =(req,res)=>{
//     var getAmbulanceDetailCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "_id": ObjectId(req.body.user_id) },
//                     { "isdeleted": false },
//                     { "isactive": 1 },
//                 ]
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'hospital_ids',
//                 'foreignField': '_id',
//                 'as': 'hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "ambulances",
//                 let: {
//                     hospital_id: "$hospitalsDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$hospital_id",
//                                             "$$hospital_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isdeleted",
//                                             false
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isactive",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_types',
//                 'localField': 'ambulancesDetail.type_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.ambulanceTypesDetails'
//             }
//         },
//         { 
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTypesDetails",
//                 "preserveNullAndEmptyArrays": true
//             } 
//         },
//         {
//             $lookup: {
//                 from: "aoc_requests",
//                 let: {
//                     ambulance_id: "$ambulancesDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$ambulance_id",
//                                             "$$ambulance_id"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "COMPLETED"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "CANCELED"
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail",
//                 "preserveNullAndEmptyArrays": false
//             }
//         },
//         {"$sort": {"ambulancesDetail.aocRequestsDetail.createdAt": -1}},
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
        
//         {
//             '$lookup': {
//                 'from': 'fast_tracks',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_requests',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'patients',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_monitors',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.moniter_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientMonitorsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_trackings',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceTrackingsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTrackingsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_images',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceImagesDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceImagesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$group': {
//                 '_id': '$ambulancesDetail._id',
//                 "ambulancesDetail" :{ $first: '$ambulancesDetail'},
//                 "name1": { $first: '$ambulancesDetail.name1' },
//                 "name2": { $first: '$ambulancesDetail.name2' },
//                 "number": { $first: '$ambulancesDetail.number' },
//                 "ambulance_phone": { $first: '$ambulancesDetail.ambulance_phone' },
//                 "ambulance_box_code": { $first: '$ambulancesDetail.ambulance_box_code' },
//                 "is_online": { $first: '$ambulancesDetail.is_online' },
//                 "aocRequestsDetail": { $first: '$ambulancesDetail.aocRequestsDetail' },
//                 "ambulanceTrackingsDetail": { $first: '$ambulancesDetail.ambulanceTrackingsDetail' },
//                 "ambulanceImagesDetail": { $first: '$ambulancesDetail.ambulanceImagesDetail' },
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": { $toInt: "$ambulance_box_code" },
//                 "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
//                 "is_assign":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail._id', false]},
//                         1,
//                         0
//                     ]
//                 },
//                 "aocRequestsDetail": {
//                     "_id": 1,
//                     "request_code": 1,
//                     "is_trauma": 1,
//                     "destination": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "full_name": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "address": 1
//                         }
//                     },
//                     "source": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "full_name": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "address": 1
//                         }
//                     },
//                     "request_status": {
//                         $cond: [
//                             {$ifNull: ['$aocRequestsDetail.request_status', false]},
//                             '$aocRequestsDetail.request_status',
//                             ''
//                         ]
//                     },
//                     "request_type" : "$aocRequestsDetail.request_type",
//                     "request_note": 1,
//                     "request_code": 1,
//                     "fastTracksDetail": {
//                         "_id": 1,
//                         "name": 1
//                     },
                
//                     "patientMonitorsDetail": {
//                         "_id": 1,
//                         "name": 1,
//                         "type": 1,
//                         "serial_number": 1,
//                         "web_address": 1,
//                         "web_port": 1,
//                         "is_online": 1,
//                         "web_view_url": 1,
//                         "rtmp_url": {
//                             $cond: {
//                                 if: {
//                                     "$eq": [
//                                         "$aocRequestsDetail.patientMonitorsDetail.type" ,
//                                         "JENNY"
//                                     ]
//                                 },
//                                 then: { 
//                                     $concat: [
//                                         'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                     ]
//                                 },
//                                 else: ''
//                         }},
//                     },
//                     "patientRequestsDetail": {
//                         "_id": 1,
//                         "sickness_type": 1,
//                         "severity_level": '$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level',
//                         "data":"$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level",
//                         "severity_color_code": { $switch: {
//                             branches: [
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 1]}, then: configure.severityColor._1 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 2]}, then: configure.severityColor._2 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 3]}, then: configure.severityColor._3 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 4]}, then: configure.severityColor._4 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 5]}, then: configure.severityColor._5 }, ],
//                                 default: configure.severityColor._1
//                             }
//                         },
//                         "diagnosis_note": 1,
//                         "patientsDetail": {
//                             "_id": 1,
//                             "first_name": 1,
//                             "last_name": 1,
//                             "age": 1,
//                             "gender": 1
//                         },
//                     },
//                     "rtmp_url": "",
//                     // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
//                     "medicalEquipmentsDetail": {
//                         "_id": 1,
//                         "name":  1,
//                         "is_visible":  1,
//                         "picture":  1,
//                         "icon_image":  1
//                     },
//                 },
//                 "is_tracking_on": {
//                     $cond: {
//                         if: {
//                             "$gt": [
//                                 { "$subtract": [ new Date(), 
//                                     { $cond: [
//                                         {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
//                                         '$ambulanceTrackingsDetail.updatedAt',
//                                         0
//                                     ] } ] },
//                                 configure.AMB_TRAKCING_TIMEOUT
//                             ]
//                         },
//                         then: 0,
//                         else: 1
//                     }
//                 },
//                 "ambulanceTrackingsDetail": {
//                     $ifNull: [
//                     {
//                         "_id": "$ambulanceTrackingsDetail._id",
//                         "location": "$ambulanceTrackingsDetail.location",
//                         "heading": "$ambulanceTrackingsDetail.heading",
//                         "speed": "$ambulanceTrackingsDetail.speed",
//                         'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
//                         "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
//                         "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
//                         "speed_color_code": { $switch: {
//                             branches: [
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: 'F82427' },
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: 'E7622A' },
//                                 { case: {$lt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: '20C00C' } ],
//                                 default: '20C00C'
//                             }
//                         }
//                     }, {}]
//                 },
//                 "ambulanceImagesDetail": {
//                     $ifNull: [ "$ambulanceImagesDetail.images", {}]
//                 },
//             }
//         },
//         {
//             '$match': {
//                 "$and": [
//                     { "is_tracking_on": 1 },
//                     { "is_assign": 1 },
//                 ]
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "tracking_server_url": 1,
//                 "is_assign":  1,
//                 "aocRequestsDetail": 1,
//                 "is_tracking_on": 1,
//                 "ambulanceTrackingsDetail": {
//                     "_id": "$ambulanceTrackingsDetail._id",
//                     "location": "$ambulanceTrackingsDetail.location",
//                     "heading": "$ambulanceTrackingsDetail.heading",
//                     "speed": "$ambulanceTrackingsDetail.speed",
//                     'covered_distance': "$ambulanceTrackingsDetail.covered_distance",
//                     "estimated_speed": "$ambulanceTrackingsDetail.speed",
//                     "estimated_time": "$ambulanceTrackingsDetail.estimated_time",
//                     "speed_color_code": {
//                         $switch: {
//                             branches: [
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 1] }
//                                         ]
//                                     }, then: '$ambulanceTrackingsDetail.speed_color_code'
//                                 },
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 0] }
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_1_ASN_0
//                                 },
//                                 {
//                                     case: {
//                                         $and: [
//                                             { $eq: [{ $toInt: "$is_tracking_on" }, 0] },
//                                             { $eq: [{ $toInt: "$is_assign" }, 1] }
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_0_ASN_1
//                                 }
//                             ],
//                             default: configure.trackingAssignColor.TR_0_ASN_1
//                         }
//                     }, 
//                 },
//                 "ambulanceImagesDetail": 1,
//             }
//         },
//         {
//             '$sort': {
//                 'is_tracking_on': -1,
//                 'is_assign': -1,
//                 'ambulance_box_code': -1
//             }
//         }
//     ];
   
//     AocUsers.aggregate(getAmbulanceDetailCondition)
//     .then((data) => {
//         var resp = {};
//         if (data.length) {
//             resp.ambulance_data = data;
//             res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
//         } else {
//             res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption));
//         }
//     })
//     .catch(err => {
//         res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
//     });
// }

exports.postAocTvOneOneTwoAmbulanceDetail =(req,res)=>{
    let resp = {};
    resp['ambulance_data'] = [];
    let respInd = 0;

    new Promise((resolve, reject)=> {
        redisClient.hget(String(req.body.user_id), 'ambulance_ids', (err, data) => {
            if(!data){ res.send(configure.apiResp(false, 1003, resp, 'data not found.', req.headers.isencryption)); return; }

            let ambulanceArr = data.split(',');
            ambulanceArr.forEach((ambulance_id, i)=> {
                redisClient.hgetall(String(ambulance_id), (err, data) => {
                    if(data){
                        if((JSON.parse(data['is_tracking_on']) == 1 && JSON.parse(data['is_assign']) == 1) || (JSON.parse(data['is_monitor_online']) == 1) && data['aocRequestsDetail'] && data['aocRequestsDetail']['patientMonitorsDetail'] && data['aocRequestsDetail']['patientMonitorsDetail']['web_view'] == 1){
                            resp['ambulance_data'][respInd] = {};
                            resp['ambulance_data'][respInd]['_id'] = ambulance_id;
                            resp['ambulance_data'][respInd]['name1'] = data['name1'] ? JSON.parse(data['name1']) : '';
                            resp['ambulance_data'][respInd]['name2'] = data['name2'] ? JSON.parse(data['name2']) : '';
                            resp['ambulance_data'][respInd]['number'] = data['number'] ? JSON.parse(data['number']) : '';
                            resp['ambulance_data'][respInd]['ambulance_phone'] = data['ambulance_phone'] ? JSON.parse(data['ambulance_phone']) : '';
                            resp['ambulance_data'][respInd]['ambulance_box_code'] = data['ambulance_box_code'] ? JSON.parse(data['ambulance_box_code']) : 0;
                            resp['ambulance_data'][respInd]['tracking_server_url'] = String(process.env.TRACKING_SERVER_URL) ? String(process.env.TRACKING_SERVER_URL) : '';
                            resp['ambulance_data'][respInd]['is_assign'] = data['is_assign'] ? JSON.parse(data['is_assign']) : 0;
                            resp['ambulance_data'][respInd]['is_tracking_on'] = data['is_tracking_on'] ? JSON.parse(data['is_tracking_on']) : 0;
                            resp['ambulance_data'][respInd]['is_monitor_online'] = data['is_monitor_online'] ? JSON.parse(data['is_monitor_online']) : 0;
            
                            if(data['aocRequestsDetail'] && data['aocRequestsDetail'] !== '') {
                                data['aocRequestsDetail'] = JSON.parse(data['aocRequestsDetail']);
                                resp['ambulance_data'][respInd]['aocRequestsDetail'] = data['aocRequestsDetail'] ? data['aocRequestsDetail'] : {};
                                if(data['aocRequestsDetail']['patientMonitorsDetail']) {
                                    resp['ambulance_data'][respInd]['is_monitor_online'] = data['aocRequestsDetail']['patientMonitorsDetail']['is_online'] ? 1 : 0;
                                    data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] = data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] ? data['aocRequestsDetail']['patientMonitorsDetail']['rtmp_url'] : '';
                                }
                                if(data['patientRequestsDetail'] && data['patientRequestsDetail'] !== '') {
                                    data['patientRequestsDetail'] = JSON.parse(data['patientRequestsDetail']);
                                    resp['ambulance_data'][respInd]['aocRequestsDetail']['patientRequestsDetail']['severity_color_code'] = data['patientRequestsDetail']['severity_color_code'] ? data['patientRequestsDetail']['severity_color_code'] : '';
                                }
                            }

            
                            if(data['ambulanceTrackingsDetail'] && data['ambulanceTrackingsDetail'] !== '') {
                                data['ambulanceTrackingsDetail'] = JSON.parse(data['ambulanceTrackingsDetail']);
                                if(data['ambulanceTrackingsDetail']['_id']){
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail'] = {};
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['_id'] = data['ambulanceTrackingsDetail']['_id'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['location'] = data['ambulanceTrackingsDetail']['location'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['heading'] = data['ambulanceTrackingsDetail']['heading'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed'] = data['ambulanceTrackingsDetail']['speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['covered_distance'] = data['ambulanceTrackingsDetail']['covered_distance'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_speed'] = data['ambulanceTrackingsDetail']['estimated_speed'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['estimated_time'] = data['ambulanceTrackingsDetail']['estimated_time'];
                                    resp['ambulance_data'][respInd]['ambulanceTrackingsDetail']['speed_color_code'] = data['ambulanceTrackingsDetail']['speed_color_code'];
                                }
                            }
            
                            if(data['ambulanceImagesDetail'] && data['ambulanceImagesDetail'] !== '') {
                                data['ambulanceImagesDetail'] = JSON.parse(data['ambulanceImagesDetail']);
                                if(data['ambulanceImagesDetail']['images'])
                                resp['ambulance_data'][respInd]['ambulanceImagesDetail'] = data['ambulanceImagesDetail']['images'];
                            }
                            
                            respInd++;
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        } else {
                            if(ambulanceArr.length == (i+1)){
                                resolve(resp);
                            }
                        }
                    } else {
                        if(ambulanceArr.length == (i+1)){
                            resolve(resp);
                        }
                    }
    
                })
            })
        })
    }).then((data)=> {

        if(data['ambulance_data'].length){
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() < new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return 1;
                }
                if (new Date(i['aocRequestsDetail']['ambulance_assign_datetime']).getTime() > new Date(j['aocRequestsDetail']['ambulance_assign_datetime']).getTime()) {
                    return -1;
                }
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].sort((i, j)=> {
                if ((i.is_tracking_on) < (j.is_tracking_on)) {
                    return 1;
                } else if ((i.is_tracking_on) > (j.is_tracking_on)) {
                    return -1;
                } 
                return 0;
            })
            data['ambulance_data'] = data['ambulance_data'].slice(0, 8);
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(true, 200, data, '', req.headers.isencryption));
        }
    })
}

// exports.postAocTvOneOneTwoAmbulanceDetail =(req,res)=>{

//     var getAmbulanceDetailCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "_id": ObjectId(req.body.user_id) },
//                     { "isdeleted": false },
//                     { "isactive": 1 },
//                 ]
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'hospital_ids',
//                 'foreignField': '_id',
//                 'as': 'hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "ambulances",
//                 let: {
//                     hospital_id: "$hospitalsDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$hospital_id",
//                                             "$$hospital_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isdeleted",
//                                             false
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$isactive",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_types',
//                 'localField': 'ambulancesDetail.type_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.ambulanceTypesDetails'
//             }
//         },
//         { 
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTypesDetails",
//                 "preserveNullAndEmptyArrays": true
//             } 
//         },
//         {
//             $lookup: {
//                 from: "aoc_requests",
//                 let: {
//                     ambulance_id: "$ambulancesDetail._id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$ambulance_id",
//                                             "$$ambulance_id"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "COMPLETED"
//                                         ]
//                                     },
//                                     {
//                                         $ne: [
//                                             "$request_status",
//                                             "CANCELED"
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {"$sort": {"ambulancesDetail.aocRequestsDetail.createdAt": -1}},
//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
        
//         {
//             '$lookup': {
//                 'from': 'fast_tracks',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'hospitals',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },

//         {
//             '$lookup': {
//                 'from': 'patient_requests',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'patients',
//                 'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
//                 'foreignField': '_id',
//                 'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             $lookup: {
//                 from: "patient_monitors",
//                 let: {
//                     moniter_id: "$ambulancesDetail.aocRequestsDetail.moniter_id",
//                 },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     {
//                                         $eq: [
//                                             "$_id",
//                                             "$$moniter_id"
//                                         ]
//                                     },
//                                     {
//                                         $eq: [
//                                             "$web_view",
//                                             1
//                                         ]
//                                     },
//                                 ]
//                             }
//                         }
//                     }
//                 ],
//                 as: "ambulancesDetail.aocRequestsDetail.patientMonitorsDetail"
//             }
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_trackings',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceTrackingsDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceTrackingsDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$lookup': {
//                 'from': 'ambulance_images',
//                 'localField': 'ambulancesDetail._id',
//                 'foreignField': 'ambulance_id',
//                 'as': 'ambulancesDetail.ambulanceImagesDetail'
//             },
//         },
//         {
//             '$unwind': {
//                 "path": "$ambulancesDetail.ambulanceImagesDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
//         },
//         {
//             '$group': {
//                 '_id': '$ambulancesDetail._id',
//                 "ambulancesDetail" :{ $first: '$ambulancesDetail'},
//                 "name1": { $first: '$ambulancesDetail.name1' },
//                 "name2": { $first: '$ambulancesDetail.name2' },
//                 "number": { $first: '$ambulancesDetail.number' },
//                 "ambulance_phone": { $first: '$ambulancesDetail.ambulance_phone' },
//                 "ambulance_box_code": { $first: '$ambulancesDetail.ambulance_box_code' },
//                 "is_online": { $first: '$ambulancesDetail.is_online' },
//                 "aocRequestsDetail": { $first: '$ambulancesDetail.aocRequestsDetail' },
//                 "ambulanceTrackingsDetail": { $first: '$ambulancesDetail.ambulanceTrackingsDetail' },
//                 "ambulanceImagesDetail": { $first: '$ambulancesDetail.ambulanceImagesDetail' },
//             }
//         },
//         {
//             '$project': {
//                 "_id": 1,
//                 "name1": 1,
//                 "name2": 1,
//                 "number": 1,
//                 "ambulance_phone": 1,
//                 "ambulance_box_code": 1,
//                 "tracking_server_url": String(process.env.TRACKING_SERVER_URL),
//                 "is_assign":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail._id', false]},
//                         1,
//                         0
//                     ]
//                 },
//                 "aocRequestsDetail": {
//                     "_id": 1,
//                     "request_code": 1,
//                     "is_trauma": 1,
//                     "destination": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "source": {
//                         "address": 1,
//                         "hospitalsDetail": {
//                             "_id": 1,
//                             "name1": 1,
//                             "name2": 1,
//                             "full_name": 1,
//                             "address": 1
//                         }
//                     },
//                     "request_status": {
//                         $cond: [
//                             {$ifNull: ['$aocRequestsDetail.request_status', false]},
//                             '$aocRequestsDetail.request_status',
//                             ''
//                         ]
//                     },
//                     "request_type" : "$aocRequestsDetail.request_type",
//                     "request_note": 1,
//                     "request_code": 1,
//                     "fastTracksDetail": {
//                         "_id": 1,
//                         "name": 1
//                     },
//                     "patientMonitorsDetail": {
//                         "_id": 1,
//                         "name": 1,
//                         "type": 1,
//                         "serial_number": 1,
//                         "web_address": 1,
//                         "web_port": 1,
//                         "web_view_url": 1,
//                         "rtmp_url": {
//                             $cond: {
//                                 if: {
//                                     "$eq": [
//                                         "$aocRequestsDetail.patientMonitorsDetail.type" ,
//                                         "JENNY"
//                                     ]
//                                 },
//                                 then: { 
//                                     $concat: [
//                                         'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$aocRequestsDetail.patientMonitorsDetail.serial_number"}
//                                     ]
//                                 },
//                                 else: ''
//                         }},                        "web_view": 1,
//                         "web_port": 1,
//                         "is_online": { $cond: [
//                             {$ifNull: ['$aocRequestsDetail.patientMonitorsDetail.is_online', false]},
//                             { $toInt: '$aocRequestsDetail.patientMonitorsDetail.is_online'},
//                             0
//                         ] }
//                     },
//                     "patientRequestsDetail": {
//                         "_id": 1,
//                         "sickness_type": 1,
//                         "severity_level": 1,
//                         'severity_color_code': { $switch: {
//                             branches: [
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 1]}, then: configure.severityColor._1 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 2]}, then: configure.severityColor._2 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 3]}, then: configure.severityColor._3 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 4]}, then: configure.severityColor._4 },
//                                 { case: {$eq: [ "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.severity_level" , 5]}, then: configure.severityColor._5 }, ],
//                                 default: configure.severityColor._1
//                             }
//                         },
//                         "diagnosis_note": 1,
//                         "patientsDetail": {
//                             "_id": 1,
//                             "first_name": 1,
//                             "last_name": 1,
//                             "age": 1,
//                             "gender": 1
//                         },
//                     },
//                     "rtmp_url": "",
//                     // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
//                     "medicalEquipmentsDetail": {
//                         "_id": 1,
//                         "name":  1,
//                         "is_visible":  1,
//                         "picture":  1,
//                         "icon_image":  1
//                     },
//                 },
//                 "is_tracking_on": {
//                     $cond: {
//                         if: {
//                             "$gt": [
//                                 { "$subtract": [ new Date(), 
//                                     { $cond: [
//                                         {$ifNull: ['$ambulanceTrackingsDetail.updatedAt', false]},
//                                         '$ambulanceTrackingsDetail.updatedAt',
//                                         0
//                                     ] } ] },
//                                 configure.AMB_TRAKCING_TIMEOUT
//                             ]
//                         },
//                         then: 0,
//                         else: 1
//                     }
//                 },
//                 "is_monitor_online":  {
//                     $cond: [
//                         {$ifNull: ['$aocRequestsDetail.patientMonitorsDetail.is_online', false]},
//                         '$aocRequestsDetail.patientMonitorsDetail.is_online',
//                         0
//                     ]
//                 },
//                 "ambulanceTrackingsDetail": {
//                     $ifNull: [
//                     {
//                         "_id": "$ambulanceTrackingsDetail._id",
//                         "location": "$ambulanceTrackingsDetail.location",
//                         "heading": "$ambulanceTrackingsDetail.heading",
//                         "speed": "$ambulanceTrackingsDetail.speed",
//                         'covered_distance': { $toInt: "$ambulanceTrackingsDetail.covered_distance" },
//                         "estimated_speed": { $toInt: { $divide: [ { $multiply: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 3600]} , 1000] } },
//                         "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
//                         "speed_color_code": { $switch: {
//                             branches: [
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120]}, then: configure.speedColor.GT_120 },
//                                 { case: {$gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.GT_80_LTE_120 },
//                                 { case: {$lte: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80]}, then: configure.speedColor.LTE_80 } ],
//                                 default: configure.speedColor.LTE_80
//                             }
//                         }
//                     }, {}]
//                 },
//                 "ambulanceImagesDetail": {
//                     $ifNull: [ "$ambulanceImagesDetail.images", {}]
//                 },
//             }
//         },
//         {
//             '$project': {
//                 '_id': 1,
//                 'name1': 1,
//                 'name2': 1,
//                 'number': 1,
//                 'ambulance_phone': 1,
//                 'ambulance_box_code': 1,
//                 'tracking_server_url': 1,
//                 'is_assign': 1,
//                 'aocRequestsDetail': 1,
//                 'is_tracking_on': 1,
//                 'is_monitor_online': 1,
//                 'ambulanceTrackingsDetail': {
//                     '_id': 1,
//                     'location': 1,
//                     'heading': 1,
//                     'speed': 1,
//                     'covered_distance': 1,
//                     'estimated_speed': 1,
//                     'estimated_time': 1,
//                     'speed_color_code': { $switch: {
//                             branches: [
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 1]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 1]}
//                                         ]
//                                     }, then: '$ambulanceTrackingsDetail.speed_color_code'
//                                 },
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 1]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 0]}
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_1_ASN_0
//                                 },
//                                 { 
//                                     case: 
//                                     {
//                                         $and: [
//                                             {$eq: [{ $toInt: "$is_tracking_on" }, 0]},
//                                             {$eq: [{ $toInt: "$is_assign" }, 1]}
//                                         ]
//                                     }, then: configure.trackingAssignColor.TR_0_ASN_1
//                                 }
//                             ],
//                             default: configure.trackingAssignColor.TR_0_ASN_1
//                         }
//                     }
//                 },
//                 'ambulanceImagesDetail': 1
//             }
//         },
//         {
//             '$match': {
//                 "$or": [
//                     {
//                         "$and": [
//                             { "is_tracking_on": 1 },
//                             { "is_assign": 1 },
//                         ]
//                     },
//                     {
//                         "is_monitor_online": 1
//                     }
//                 ]
//             }
//         },
//         {
//             '$sort': {
//                 'aocRequestsDetail.patientMonitorsDetail.is_online': -1,
//                 'is_assign': -1,
//                 'is_tracking_on': -1,
//                 'ambulance_box_code': -1
//             }
//         }
//     ];
   
//     AocUsers.aggregate(getAmbulanceDetailCondition)
//     .then((data) => {
//         var resp = {};
//         if (data.length) {
//             resp.ambulance_data = data;
//             res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
//         } else {
//             res.send(configure.apiResp(false, 1003, resp, 'data not found.',req.headers.isencryption));
//         }
//     })
//     .catch(err => {
//         res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Ambulances.",req.headers.isencryption));
//     });
// }

exports.postAmbulanceCrashDetail = (req,res)=>{

    var ambulanceCrashDetailCondition = [
        { 
            '$match': {
                "_id": ObjectId(req.body.ambulance_crash_id)
            }
        },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'ambulance_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail'
            }
        },
        { '$unwind': '$ambulancesDetail' },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'ambulancesDetail.hospital_id',
                'foreignField': '_id',
                'as': 'hospitalsDetail'
            }
        },
        { '$unwind': '$hospitalsDetail' },
        {
            '$lookup': {
                'from': 'aoc_requests',
                'localField': 'aocRequestsDetail.fast_track_id',
                'foreignField': '_id',
                'as': 'aocRequestsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$aocRequestsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'ambulance_image_histories',
                'localField': 'ambulance_image_histories_id',
                'foreignField': '_id',
                'as': 'ambulanceImageHistoriesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulanceImageHistoriesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$project': {
                '_id': '$ambulancesDetail._id',
                'name1': '$ambulancesDetail.name1',
                'name2': '$ambulancesDetail.name2',
                'number': '$ambulancesDetail.number',
                'ambulance_box_code': '$ambulancesDetail.ambulance_box_code',
                'location': 1,
                'speed': 1,
                'hospitalsDetail': {
                    '_id': 1,
                    'name1': 1,
                    'name2': 1,
                    'full_name': 1,
                },
                "aocRequestsDetail": {
                    "request_status": {
                        $cond: [
                            { $ifNull: ['$aocRequestsDetail.request_status', false] },
                            '$aocRequestsDetail.request_status',
                            ''
                        ]
                    },
                    'request_code': {
                        $cond: [
                            { $ifNull: ['$aocRequestsDetail.request_code', false] },
                            '$aocRequestsDetail.request_code',
                            ''
                        ]
                    },
                },
                'ambulanceImageHistoriesDetail': {
                    '_id': 1,
                    'images': 1
                },
                'location_detail': 1,
                'createdAt': 1,
            },
        }
    ];

    AmbulanceCrashes.aggregate(ambulanceCrashDetailCondition)
    .then(data=>{
        var response = data[0];
        response["tracking_server_url"] = String(process.env.TRACKING_SERVER_URL);
        res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
    }).catch(err=>{
        res.status(500).send(configure.apiResp(false, 500, {}, err.message ,req.headers.isencryption));
    })

}