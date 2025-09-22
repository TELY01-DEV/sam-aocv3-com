const { redisClient } = require('./server');
const db = require("./config/db.config");
const configure = require("./config/configure");
const Hospitals = db.hospitals;
const AocUsers = db.aoc_users;

INTERVAL_TIME = process.env.LOCAL_REDIS_REFRESH_SEC;

if(process.env.ENVIRONMENT == 'LIVE'){
    setInterval(() => {
        let aocUsersCond = [{
            '$match': {
                "$and": [
                    { isdeleted: false },
                    { isactive: 1 }
                ]
            }
        },
        {
            '$unwind': {
                "path": "$hospital_ids",
                "preserveNullAndEmptyArrays": false
            }
        },
        {
            '$lookup': {
                from: "ambulances",
                let: {
                    hospital_id: "$hospital_ids",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$hospital_id",
                                            "$$hospital_id"
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
            '$unwind': {
                "path": "$ambulancesDetail",
                "preserveNullAndEmptyArrays": false
            }
        },
        {
            '$project': {
                '_id': 1,
                'ambulancesDetail': {
                    '_id': 1,
                },
            }
        },
        {
            '$group': {
                '_id': '$_id',
                'ambulancesDetail': { $addToSet: '$ambulancesDetail._id' },
            }
        }];
        AocUsers.aggregate(aocUsersCond).then((user_data)=> {
            user_data.forEach((user_detail)=> {
                redisClient.hmset(String(user_detail._id), 'ambulance_ids', (user_detail.ambulancesDetail).join());
            })
        })
    }, 1800000);
    
    setInterval(() => {
        var OngoingRequestListCondition = [
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
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'drivers',
                    'localField': 'ambulancesDetail.aocRequestsDetail.driver_ids',
                    'foreignField': '_id',
                    'as': 'ambulancesDetail.aocRequestsDetail.driversDetail'
                }
            },
            {
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail.driversDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'patient_requests',
                    'localField': 'ambulancesDetail.aocRequestsDetail.patient_request_id',
                    'foreignField': '_id',
                    'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail'
                }
            },
            {
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'patients',
                    'localField': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id',
                    'foreignField': '_id',
                    'as': 'ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail'
                }
            },
            {
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'hospitals',
                    'localField': 'ambulancesDetail.aocRequestsDetail.source._id',
                    'foreignField': '_id',
                    'as': 'ambulancesDetail.aocRequestsDetail.source.hospitalsDetail'
                },
            },
            {
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail.source.hospitalsDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'hospitals',
                    'localField': 'ambulancesDetail.aocRequestsDetail.destination._id',
                    'foreignField': '_id',
                    'as': 'ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail'
                },
            },
            {
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail.destination.hospitalsDetail",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                '$lookup': {
                    'from': 'fast_tracks',
                    'localField': 'ambulancesDetail.aocRequestsDetail.fast_track_id',
                    'foreignField': '_id',
                    'as': 'ambulancesDetail.aocRequestsDetail.fastTracksDetail'
                },
            },
            {
                '$unwind': {
                    "path": "$ambulancesDetail.aocRequestsDetail.fastTracksDetail",
                    "preserveNullAndEmptyArrays": true
                }
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
                '$group': {
                    '_id': '$ambulancesDetail._id',
                    'ambulance_box_code': { $first :'$ambulancesDetail.ambulance_box_code' },
                    'name1': { $first : '$ambulancesDetail.name1' },
                    'name2': { $first : '$ambulancesDetail.name2' },
                    'number': { $first : '$ambulancesDetail.number' },
                    'ambulance_phone': { $first : '$ambulancesDetail.ambulance_phone' },
                    'is_online': { $first : '$ambulancesDetail.is_online' },
                    'aocRequestsDetail':  { $first :'$ambulancesDetail.aocRequestsDetail' },
                    'patientRequestsDetail':  { $first :'$ambulancesDetail.aocRequestsDetail.patientRequestsDetail' },
                    'ambulanceTrackingsDetail':  { $first :'$ambulancesDetail.ambulanceTrackingsDetail' },
                    'ambulanceImagesDetail':  { $first :'$ambulancesDetail.ambulanceImagesDetail' },
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'name1': 1,
                    'name2': 1,
                    'number': 1,
                    'ambulance_phone': 1,
                    'is_online': 1,
                    'ambulance_box_code': { $toInt: '$ambulance_box_code' },
                    'aocRequestsDetail': {
                        "_id": 1,
                        "request_code": 1,
                        "creater_id": 1,
                        "creater_type": 1,
                        "request_type": 1,
                        "request_note": 1,
                        "request_status": 1,
                        "patientMonitorsDetail" :{
                            "_id":1,
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
                            "web_view_url": {
                                $cond: [
                                    { $ifNull: ["$aocRequestsDetail.patientMonitorsDetail._id", false] },
                                    { 
                                        $concat: [
                                            String(process.env.MONITER_STREAMING_SERVER_URL),  {$toString : "$aocRequestsDetail.patientMonitorsDetail.serial_number"}
                                        ]
                                    },
                                    ''
                                ]
                            },
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
                        "fastTracksDetail": 1,
                        "destination": 1,
                        "source": 1,
                        "patientRequestsDetail": 1,
                        "destination_type": 1,
                        "is_trauma": 1,
                        "info": 1,
                        "ambulance_assign_datetime": 1,
                        "diagnosis_note": 1,
                        // "web_view_url": {
                        //     $cond: [
                        //         { $ifNull: ["$aocRequestsDetail.patientMonitorsDetail._id", false] },
                        //         { 
                        //             $concat: [
                        //                 String(process.env.MONITER_STREAMING_SERVER_URL),  {$toString : "$aocRequestsDetail.patientMonitorsDetail.serial_number"}
                        //             ]
                        //         },
                        //         ''
                        //     ]
                        // },
                        // "rtmp_url": {
                        //     $cond: [
                        //         { $ifNull: ["$aocRequestsDetail.patientMonitorsDetail._id", false] },
                        //         { 
                        //             $concat: [
                        //                 'rtmp://' ,String(process.env.MONITER_STREAMING_SERVER_IP) ,':1935/live/temp_' , {$toString :"$aocRequestsDetail.patientMonitorsDetail.serial_number"}
                        //             ]
                        //         },
                        //         ''
                        //     ]
                        // },
                    },
                    'patientRequestsDetail': {
                        "_id": 1,
                        "sickness_type": 1,
                        "severity_level":{ $toInt: '$patientRequestsDetail.severity_level'},
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
                    'ambulanceImagesDetail': 1,
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'name1': 1,
                    'name2': 1,
                    'number': 1,
                    'ambulance_phone': 1,
                    'is_online': 1,
                    'ambulance_box_code': 1,
                    'aocRequestsDetail': 1,
                    'patientRequestsDetail': {
                        "_id": 1,
                        "sickness_type": 1,
                        "severity_level": 1,
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
                    'ambulanceImagesDetail': 1,
                }
            },
        ];
    
        Hospitals.aggregate(OngoingRequestListCondition)
        .then(data => {
            if(data.length){
                data.forEach(ambulance_detail => {
                    redisClient.hmset(String(ambulance_detail._id), 'is_assign', '0');
                    redisClient.hmset(String(ambulance_detail._id), 'is_tracking_on', JSON.stringify(ambulance_detail.is_tracking_on));
                    redisClient.hmset(String(ambulance_detail._id), 'is_monitor_online', '0');
    
                    redisClient.hmset(String(ambulance_detail._id), 'name1', JSON.stringify(ambulance_detail.name1));
                    redisClient.hmset(String(ambulance_detail._id), 'name2', JSON.stringify(ambulance_detail.name2));
                    redisClient.hmset(String(ambulance_detail._id), 'number', JSON.stringify(ambulance_detail.number));
                    redisClient.hmset(String(ambulance_detail._id), 'ambulance_phone', JSON.stringify(ambulance_detail.ambulance_phone));
                    redisClient.hmset(String(ambulance_detail._id), 'ambulance_box_code', JSON.stringify(ambulance_detail.ambulance_box_code));
                    if(ambulance_detail.patientRequestsDetail && ambulance_detail.patientRequestsDetail._id) {
                        redisClient.hmset(String(ambulance_detail._id), 'patientRequestsDetail', JSON.stringify(ambulance_detail.patientRequestsDetail));
                    } else {
                        redisClient.hmset(String(ambulance_detail._id), 'patientRequestsDetail', '');
                    } 
                    if(ambulance_detail.ambulanceTrackingsDetail && ambulance_detail.ambulanceTrackingsDetail._id) {
                        redisClient.hmset(String(ambulance_detail._id), 'ambulanceTrackingsDetail', JSON.stringify(ambulance_detail.ambulanceTrackingsDetail));
                    } else {
                        redisClient.hmset(String(ambulance_detail._id), 'ambulanceTrackingsDetail', '');
                    } 
                    if(ambulance_detail.ambulanceImagesDetail && ambulance_detail.ambulanceImagesDetail._id) {
                        redisClient.hmset(String(ambulance_detail._id), 'ambulanceImagesDetail', JSON.stringify(ambulance_detail.ambulanceImagesDetail));
                    } else {
                        redisClient.hmset(String(ambulance_detail._id), 'ambulanceImagesDetail', '');
                    } 
                    if(ambulance_detail.aocRequestsDetail && ambulance_detail.aocRequestsDetail._id) {
                        redisClient.hmset(String(ambulance_detail._id), 'is_assign', '1');
                        redisClient.hmset(String(ambulance_detail._id), 'aocRequestsDetail', JSON.stringify(ambulance_detail.aocRequestsDetail));
                        if(ambulance_detail.aocRequestsDetail.patientMonitorsDetail && 
                        ambulance_detail.aocRequestsDetail.patientMonitorsDetail._id && 
                        ambulance_detail.aocRequestsDetail.patientMonitorsDetail.is_online) {
                            redisClient.hmset(String(ambulance_detail._id), 'is_monitor_online', '1');
                        }
                    } else {
                        // redisClient.del(String(ambulance_detail._id));
                    } 
               });
            }
        })
        .catch(err => {
            console.log(err);
        });
    }, INTERVAL_TIME * 1000);
}