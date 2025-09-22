const configure = require("../../config/configure");
const db = require("../../config/db.config");
const fcmPush = require("../../config/fcm-push");
const notification_lang = require("../../config/push_lang");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const UserNotificationSettings = db.user_notification_settings;
const Ambulances = db.ambulances;

exports.postAmbulanceSpeedNotification = (req, res) => {
    var getAmbulanceDetailCondition = [
        {
            '$match': {
                "$and": [
                    { "_id": ObjectId(req.body.ambulance_id) }
                ]
            }
        },
        {
            '$lookup': {
                from: "aoc_users",
                let: {
                    hospital_id: "$hospital_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: [
                                    "$$hospital_id",
                                    "$hospital_ids"
                                ]
                            }
                        }
                    },
                ],
                as: "aocUsersDetail"
            }
        },
        {
            '$lookup': {
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
                    },
    
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
            '$lookup': {
                'from': 'ambulance_trackings',
                'localField': '_id',
                'foreignField': 'ambulance_id',
                'as': 'ambulanceTrackingsDetail'
            },
        },
        {
            '$unwind': {
                "path": "$ambulanceTrackingsDetail",
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
            '$project': {
                "_id": 1,
                "name1": 1,
                "name2": 1,
                "ambulance_phone": 1,
                "number": 1,
                "ambulance_box_code": 1,
                "aocUsersDetail":"$aocUsersDetail",
                "is_assign": {
                    $cond: [
                        { $ifNull: ['$aocRequestsDetail._id', false] },
                        1,
                        0
                    ]
                },
                "aocRequestsDetail": {
                    "_id": 1,
                    "request_type": "$aocRequestsDetail.request_type",
                    "request_code": 1,
                    "creater_id": 1,
                    "creater_type": 1,
                    "doctorsDetail": {
                        "_id": 1,
                        "device_token": { $ifNull: ['$aocRequestsDetail.doctorsDetail.device_token', ''] },
                        "app_language": 1,
                    }, 
                    "nursesDetail": {
                        "_id": 1,
                        "device_token": { $ifNull: ['$aocRequestsDetail.nursesDetail.device_token', ''] },
                        "app_language": 1,
                    }, 
                    "driversDetail": {
                        "_id": 1,
                        "device_token": { $ifNull: ['$aocRequestsDetail.driversDetail.device_token', ''] },
                        "app_language": 1,
                    }, 
                    "aocErStaffsDetail": {
                        "_id": 1,
                        "device_token": { $ifNull: ['$aocRequestsDetail.aocErStaffsDetail.device_token', ''] },
                        "app_language": 1,
                    }, 
                    "aocEmsStaffsDetail": {
                        "_id": 1,
                        "device_token": { $ifNull: ['$aocRequestsDetail.aocEmsStaffsDetail.device_token', ''] },
                        "app_language": 1,
                    }
                },
                "is_tracking_on": {
                    $cond: {
                        if: {
                            "$gt": [
                                { "$subtract": [new Date(), "$ambulanceTrackingsDetail.updatedAt"] },
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
                            "_id": "$ambulanceTrackingsDetail._id",
                            "speed": "$ambulanceTrackingsDetail.speed",
                            "estimated_time": { $toInt: "$ambulanceTrackingsDetail.estimated_time" },
                            "speed_color_code": {
                                $switch: {
                                    branches: [
                                        { case: { $gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120] }, then: configure.speedColor.GT_120 },
                                        { case: { $gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80] }, then: configure.speedColor.GT_80_LTE_120 },
                                        { case: { $lte: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80] }, then: configure.speedColor.LTE_80 }],
                                    default: configure.speedColor.LTE_80
                                }
                            }
                        }, {}]
                },
            }
        },
        {
            '$project': {
                "_id": 1,
                "name1": 1,
                "name2": 1,
                "ambulance_phone": 1,
                "number": 1,
                "ambulance_box_code": 1,
                "is_assign": 1,
                "aocRequestsDetail": 1,
                "is_tracking_on": 1,
                "aocUsersDetail":"$aocUsersDetail",
                "ambulanceTrackingsDetail": {
                    "_id": 1,
                    "speed": 1,
                    "estimated_time": 1,
                    "speed_color_code": {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $and: [
                                            { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
                                            { $eq: [{ $toInt: "$is_assign" }, 1] }
                                        ]
                                    }, then: '$ambulanceTrackingsDetail.speed_color_code'
                                },
                                {
                                    case: {
                                        $and: [
                                            { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
                                            { $eq: [{ $toInt: "$is_assign" }, 0] }
                                        ]
                                    }, then: configure.trackingAssignColor.TR_1_ASN_0
                                },
                                {
                                    case: {
                                        $and: [
                                            { $eq: [{ $toInt: "$is_tracking_on" }, 0] },
                                            { $eq: [{ $toInt: "$is_assign" }, 1] }
                                        ]
                                    }, then: configure.trackingAssignColor.TR_0_ASN_1
                                }
                            ],
                            default: configure.trackingAssignColor.TR_0_ASN_1
                        }
                    }
                },
            }
        }
    ];

    Ambulances.aggregate(getAmbulanceDetailCondition)
        .then((data) => {
            switch (req.body.notification_type) {
                case 'SPEED_ABOVE_80':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULANCE_SPEED_WARNING", configure.notificationSound.AMBULANCE_SPEED_ABOVE_80)
                    break;

                case 'SPEED_BELOW_80':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULANCE_SPEED_NORMAL",configure.notificationSound.AMBULANCE_SPEED_BELOW_80)
                    break;

                case 'SPEED_ABOVE_120':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULANCE_SPEED_ALERT", configure.notificationSound.AMBULANCE_SPEED_ABOVE_120)
                    break;

                case 'SPEED_BELOW_120':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULANCE_SPEED_WARNING", configure.notificationSound.AMBULANCE_SPEED_ABOVE_80)
                    break;

                case 'AMBULACNE_NEAR_ABOUT_SCENE':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULACNE_NEAR_SCENE", configure.notificationSound.AMBULANCE_ESTIMATE_TIME)
                    break;

                case 'AMBULANCE_TRACKING_STATUS_ONLINE':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULANCE_STATUS", configure.notificationSound.AMBULANCE_TRACKING_ONLINE)
                    break;

                case 'AMBULANCE_TRACKING_STATUS_OFFLINE':
                    configure.postAmbulanceSpeedNotification(data, req.body.notification_type, "AMBULANCE_STATUS", configure.notificationSound.AMBULANCE_TRACKING_OFFLINE)
                    break;

                default:

                    break;
            }
            res.json(data);
        })

}

exports.postCreateReqNotification = (req, res) => {
    configure.createReqNotification(req.body.aoc_request_id, req.body.aoc_zone_id);
    res.status(200).send(true);
}




