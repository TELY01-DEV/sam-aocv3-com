const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const fcmPush = require("../../../config/fcm-push");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const AocUsers = db.aoc_users;
const AmbulanceCrashes = db.ambulance_crashes;

exports.postAmbulanceCrashReport = (req,res)=>{
    var current_page = Number(req.body.current_page);
    var page_size = Number(req.body.page_size);

    var ambulanceCrashReportCondition = [
        { 
            '$match': {
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
        { '$unwind': '$hospitalsDetail' }
    ];

    if(req.body.zone_id && (req.body.zone_id !== '')){
        ambulanceCrashReportCondition.push({
            '$match': {
                "hospitalsDetail.zone_id": ObjectId(req.body.zone_id)
            }
        });
    }

    ambulanceCrashReportCondition.push(
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'hospitalsDetail._id',
                'foreignField': 'hospital_id',
                'as': 'ambulancesDetail'
            }
        },
        { '$unwind': '$ambulancesDetail' },
    )

    if(req.body.hospital_id && (req.body.hospital_id !== '')){
        ambulanceCrashReportCondition.push({
            '$match': {
                "ambulancesDetail.hospital_id": ObjectId(req.body.hospital_id)
            }
        });
    }

    ambulanceCrashReportCondition.push(
        {
            '$lookup': {
                'from': 'ambulance_crashes',
                'localField': 'ambulancesDetail._id',
                'foreignField': 'ambulance_id',
                'as': 'ambulancesDetail.ambulanceCrashesDetail'
            }
        },
        { '$unwind': '$ambulancesDetail.ambulanceCrashesDetail' },
        {
            '$lookup': {
                'from': 'ambulance_image_histories',
                'localField': 'ambulancesDetail.ambulanceCrashesDetail.ambulance_image_histories_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail.ambulanceCrashesDetail.ambulanceImageHistoriesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail.ambulanceCrashesDetail.ambulanceImageHistoriesDetail",
                "preserveNullAndEmptyArrays": true
            }
        }
    )

    if(req.body.start_date && req.body.start_date !== ''){
        ambulanceCrashReportCondition.push({
            '$match': {
                '$expr':{
                '$and': [
                    {
                        $gte: [
                            "$ambulancesDetail.ambulanceCrashesDetail.createdAt",
                            new Date(req.body.start_date)
                        ]
                    },
                    {
                        $lte: [
                            "$ambulancesDetail.ambulanceCrashesDetail.createdAt",
                            new Date(req.body.end_date)
                        ]
                    }
                ]
            }
            }
        });
    }

    ambulanceCrashReportCondition.push({ '$count': "count" });
    AocUsers.aggregate(ambulanceCrashReportCondition)
    .then(count=>{
     
        ambulanceCrashReportCondition.splice(-1,1);

        ambulanceCrashReportCondition.push(
            {
                '$group': {
                    '_id': '$ambulancesDetail.ambulanceCrashesDetail._id',
                    'name1': { $first: '$ambulancesDetail.name1' },
                    'name2': { $first: '$ambulancesDetail.name2' },
                    'number': { $first: '$ambulancesDetail.number' },
                    'ambulance_box_code': { $first: '$ambulancesDetail.ambulance_box_code' },
                    'ambulanceCrashesDetail': { $first: '$ambulancesDetail.ambulanceCrashesDetail' }
                },
            },
            {
                '$project': {
                    '_id': 1,
                    'name1': 1,
                    'name2': 1,
                    'number': 1,
                    'ambulance_box_code': 1,
                    'ambulanceCrashesDetail': {
                        'ambulance_id': 1,
                        'location': 1,
                        'speed': 1,
                        'app_notification':1,
                        'ambulanceImageHistoriesDetail': {
                            '_id': 1,
                            'images': 1
                        },
                        'location_detail': {
                            'address': 1,
                            'image': 1
                        },
                        'createdAt': 1,
                    }
                },
            },
            { "$sort": {'ambulanceCrashesDetail.createdAt': -1 } }
        );

        ambulanceCrashReportCondition.push({ "$skip": Number((current_page - 1) * page_size) });
        ambulanceCrashReportCondition.push({ "$limit": Number(page_size) });

        AocUsers.aggregate(ambulanceCrashReportCondition)
        .then(data=>{
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            response["tracking_server_url"] = String(process.env.TRACKING_SERVER_URL);

            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
        }).catch(err=>{
            res.status(500).send(configure.apiResp(false, 500, {}, err.message,req.headers.isencryption));
        })
    }).catch(err=>{
        res.status(500).send(configure.apiResp(false, 500, {}, err.message,req.headers.isencryption));
    })

}

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
        res.status(500).send(configure.apiResp(false, 500, {}, err.message,req.headers.isencryption));
    })

}


exports.postConfirmAmbulanceCrash = (req,res)=>{
// var confirmAmbulanceCrashCondition = []
// confirmAmbulanceCrashCondition.push({
//     '$match': {
//         "_id": ObjectId(req.body.ambulance_crash_id)
//     }
// })
// confirmAmbulanceCrashCondition.push({
//         '$lookup': {
//             from: "aoc_requests",
//             let: {
//                 ambulance_id: "$ambulance_id",
//             },
//             pipeline: [
//                 {
//                     $match: {
//                         $expr: {
//                             $and: [
//                                 {
//                                     $eq: [
//                                         "$$ambulance_id",
//                                         "$ambulance_id"
//                                     ]
//                                 },
//                                 {
//                                     $ne: [
//                                         "$request_status",
//                                         "COMPLETED"
//                                     ]
//                                 },
//                                 {
//                                     $ne: [
//                                         "$request_status",
//                                         "CANCELED"
//                                     ]
//                                 },
//                             ]
//                         }
//                     }
//                 }
//             ],
//             as: "aocRequestDetail"
//         }},
//         {
//             '$unwind': {
//                 "path": "$aocRequestDetail",
//                 "preserveNullAndEmptyArrays": true
//             }
    
// })
// confirmAmbulanceCrashCondition.push(
// {
//     '$lookup': {
//         'from': 'drivers',
//         'localField': 'aocRequestDetail.driver_ids',
//         'foreignField': '_id',
//         'as': 'aocRequestDetail.driversDetail'
//     }
// },

// {
//     '$lookup': {
//         'from': 'nurses',
//         'localField': 'aocRequestDetail.nurse_ids',
//         'foreignField': '_id',
//         'as': 'aocRequestDetail.nursesDetail'
//     }
// },

// {
//     '$lookup': {
//         'from': 'doctors',
//         'localField': 'aocRequestDetail.doctor_ids',
//         'foreignField': '_id',
//         'as': 'aocRequestDetail.doctorsDetail'
//     }
// },

// {
//     '$lookup': {
//         'from': 'aoc_er_staffs',
//         'localField': 'aocRequestDetail.er_ids',
//         'foreignField': '_id',
//         'as': 'aocRequestDetail.erstaffDetail'
//     }
// },

// {
//     '$lookup': {
//         'from': 'aoc_ems_staffs',
//         'localField': 'aocRequestDetail.ems_ids',
//         'foreignField': '_id',
//         'as': 'aocRequestDetail.emsstaffDetail'
//     }
// },

// )
// confirmAmbulanceCrashCondition.push(
//     {
//         '$lookup': {
//             'from': 'ambulances',
//             'localField': 'ambulance_id',
//             'foreignField': '_id',
//             'as': 'ambulancesDetail'
//         }
//     },
//     {
//         '$unwind': {
//             "path": "$ambulancesDetail",
//             "preserveNullAndEmptyArrays": true
//         }
//     },
//     {
//         '$lookup': {
//             'from': 'hospitals',
//             'localField': 'ambulancesDetail.hospital_id',
//             'foreignField': '_id',
//             'as': 'hospitalsDetail'
//         }
//     },
//     {
//         '$unwind': {
//             "path": "$hospitalsDetail",
//             "preserveNullAndEmptyArrays": true
//         }
//     },
   
//     {
//         '$lookup': {
//             'from': 'aoc_users',
//             'localField': 'ambulancesDetail.hospital_id',
//             'foreignField': 'hospital_ids',
//             'as': 'aocUsersDetail'
//         }
//     },
// )
// confirmAmbulanceCrashCondition.push(
//     {
//         $project :{
//             "_id" :1,
//             "ambulance_id":1,
//             "aocUsersDetail":{
//                 "_id":1,
//                 "first_name":1,
//                 "device_token":1
//             },
//             "aocRequestDetail" : {
//                 '_id':1,
//                 // $cond :[
//                 // {$ifNull : ["$aocRequestDetail._id",false]} ,{
//                 "request_type":1,
//                 "source":"$aocRequestDetail.source",
//                 "destination" :1,
//                 "driversDetail" :{
//                     "_id":1,
//                     "device_token" :1,
//                     // "_id" : "$aocRequestDetail.driversDetail._id",
//                     // "device_token" :"$aocRequestDetail.driversDetail.device_token",
//                 },
//                 "emsstaffDetail" :{
//                     "_id":1,
//                     "device_token" :1,
//                     // "_id" : "$aocRequestDetail.driversDetail._id",
//                     // "device_token" : "$aocRequestDetail.driversDetail.device_token",

//                 },
//                 "erstaffDetail" :{
//                     "_id":1,
//                     "device_token" :1,
//                     // _id :"$aocRequestDetail.erstaffDetail._id",
//                     // device_token :"$aocRequestDetail.erstaffDetail.device_token"

//                 },
//                 "doctorsDetail" :{
//                     "_id" :"$aocRequestDetail.doctorsDetail._id",
//                     "device_token" :"$aocRequestDetail.doctorsDetail.device_token"

//                 },
//                 "nursesDetail" :{
//                     "_id":1,
//                     "device_token" :1,
//                     // _id :"$aocRequestDetail.nursesDetail._id",
//                     // device_token :"$aocRequestDetail.nursesDetail.device_token"

//                 }
        
//         }
//     }
// }
// )

// AmbulanceCrashes.aggregate(confirmAmbulanceCrashCondition)
// .then(data=>{
    AmbulanceCrashes.findOneAndUpdate({"_id": ObjectId(req.body.ambulance_crash_id)}, { $set: { 'app_notification': 1 }},{new: true}).then(data=> {
        var response = data;
        configure.sendCrashPush(response.ambulance_id, data._id)
        res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
    });
}
// }).catch(err=>{
//     console.log(err);
//      res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
// })
// }