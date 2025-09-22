const { socket, redisClient } = require("../server");

var fs = require('fs');
const db = require("../config/db.config");
const configure = require("../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ambulance_online_timeout = 60000;

const Ambulances = db.ambulances;
const AmbulanceTrackings = db.ambulance_trackings;
const AmbulanceTrackingHistories = db.ambulance_tracking_histories;
const tracking_timeout_array = [];
const eta_timeout_array = [];

exports.postAmbulanceTracking = (req, res) => {
    // console.log('=======================================================', req.body);
    var AmbulancesCondition = [
        {
            "$match": {
                'ambulance_box_code': String(req.body.ambulance_id),
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
            '$group': {
                '_id': '$_id',
                'ambulance_box_code': { $first: '$ambulance_box_code' },
                "aocRequestsDetail": { $first: '$aocRequestsDetail' }
            }
        },
        {
            '$project': {
                "_id": 1,
                "ambulance_box_code": 1,
                "aocRequestsDetail": {
                    "_id": 1,
                    "request_type": 1,
                    "request_status":1
                },
                "is_assign": {
                    $cond: [
                        { $ifNull: ['$aocRequestsDetail._id', false] },
                        1,
                        0
                    ]
                },
            }
        }
    ];

    Ambulances.aggregate(AmbulancesCondition).then((ambulance_data) => {
        if (ambulance_data.length) {
            req.body._id = String(ambulance_data[0]._id);
            req.body.is_assign = Number(ambulance_data[0].is_assign);
            req.body.type = 'TRACKING';
            req.body.request_type = (ambulance_data[0].aocRequestsDetail) ? String(ambulance_data[0].aocRequestsDetail.request_type) : '';
            // req.body.tracking_speed = Number(+(req.body.tracking_speed) * 3.6);
            req.body.tracking_speed = (typeof req.body.tracking_speed !== 'nan') ? Number(+(req.body.tracking_speed) * 3.6) : 0;
            AmbulanceTrackings.findOne({ ambulance_id: ObjectId(ambulance_data[0]._id) }).then((ambulance_tracking_data) => {
                var speed_above_80 = null, speed_above_120 = null;
                var current_datetime = new Date(Date.now());
                var current_state = 'GREEN';
                var covered_distance = 0;

                if (ambulance_tracking_data) {

                    if (tracking_timeout_array[ambulance_data[0]._id]) {
                        clearTimeout(tracking_timeout_array[ambulance_data[0]._id]);
                        tracking_timeout_array[ambulance_data[0]._id] = setTimeout(() => {
                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", ambulance_data[0]._id, "AMBULANCE_TRACKING_STATUS_OFFLINE")
                        }, ambulance_online_timeout);
                    } else {
                        tracking_timeout_array[ambulance_data[0]._id] = setTimeout(() => {
                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", ambulance_data[0]._id, "AMBULANCE_TRACKING_STATUS_OFFLINE")
                        }, ambulance_online_timeout);

                        configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", ambulance_data[0]._id, "AMBULANCE_TRACKING_STATUS_ONLINE");
                    }

                    if (Number(req.body.tracking_speed) > 80 && Number(req.body.tracking_speed) <= 120) {
                        if (ambulance_tracking_data.speed > 120) {
                            // console.log(ambulance_data[0].ambulance_box_code, "SPEED_BELOW_120");

                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", (ambulance_data[0]._id), "SPEED_BELOW_120");
                        } else if (ambulance_tracking_data.speed <= 80) {
                            // console.log(ambulance_data[0].ambulance_box_code, "SPEED_ABOVE_80");

                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", ObjectId(ambulance_data[0]._id), "SPEED_ABOVE_80");
                        }

                        speed_above_80 = (ambulance_tracking_data.speed_above_80) ? ObjectId(ambulance_tracking_data.speed_above_80) : (new ObjectId());

                        var ambulance_tracking_histories = new AmbulanceTrackingHistories({
                            ambulance_id: ObjectId(ambulance_data[0]._id),
                            locations: {
                                lat: req.body.tracking_latitude, lon: req.body.tracking_longitude
                            },
                            speed_above_80: speed_above_80,
                            speed: Number(req.body.tracking_speed),
                            state: String(current_state),
                        })

                        ambulance_tracking_histories
                            .save(ambulance_tracking_histories)
                            .then()
                    } else if (Number(req.body.tracking_speed) > 120) {
                        if (ambulance_tracking_data.speed <= 120) {
                            // console.log(ambulance_data[0].ambulance_box_code, "SPEED_ABOVE_120");

                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", (ambulance_data[0]._id),"SPEED_ABOVE_120");
                        }

                        speed_above_120 = (ambulance_tracking_data.speed_above_120) ? ObjectId(ambulance_tracking_data.speed_above_120) : (new ObjectId());
                        speed_above_80 = (ambulance_tracking_data.speed_above_80) ? ObjectId(ambulance_tracking_data.speed_above_80) : (new ObjectId());

                        var ambulance_tracking_histories = new AmbulanceTrackingHistories({
                            ambulance_id: ObjectId(ambulance_data[0]._id),
                            locations: {
                                lat: req.body.tracking_latitude, lon: req.body.tracking_longitude
                            },
                            speed_above_80: speed_above_80,
                            speed_above_120: speed_above_120,
                            speed: Number(req.body.tracking_speed),
                            state: String(current_state),
                        })

                        ambulance_tracking_histories
                            .save(ambulance_tracking_histories)
                            .then()
                    } else {
                        if(ambulance_tracking_data.speed > 80){
                            // console.log(ambulance_data[0].ambulance_box_code, "SPEED_BELOW_80");

                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", (ambulance_data[0]._id),"SPEED_BELOW_80");
                        } else if(ambulance_tracking_data.speed > 120){
                            // console.log(ambulance_data[0].ambulance_box_code, "SPEED_BELOW_120");

                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", (ambulance_data[0]._id), "SPEED_BELOW_120");

                            // console.log(ambulance_data[0].ambulance_box_code, "SPEED_BELOW_80");

                            configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", (ambulance_data[0]._id),"SPEED_BELOW_80");
                        }

                        var ambulance_tracking_histories = new AmbulanceTrackingHistories({
                            ambulance_id: ObjectId(ambulance_data[0]._id),
                            locations: {
                                lat: req.body.tracking_latitude, lon: req.body.tracking_longitude
                            },
                            speed: Number(req.body.tracking_speed),
                            state: String(current_state),
                        })

                        ambulance_tracking_histories
                            .save(ambulance_tracking_histories)
                            .then()
                    }

                    current_state = ambulance_tracking_data.state;

                    var ambulance_speed = Number(req.body.tracking_speed);

                    var source_location = {
                        lat: ambulance_tracking_data.source_location.lat, lon: ambulance_tracking_data.source_location.lon
                    }

                    var current_location = {
                        lat: Number(req.body.tracking_latitude), lon: Number(req.body.tracking_longitude)
                    }

                    var destination_location = {
                        lat: ambulance_tracking_data.destination_location.lat, lon: ambulance_tracking_data.destination_location.lon
                    }

                    var covered_distance = 0;
                    configure.getDistanceFromTwoLocation(source_location, current_location).then((complete_distance) => {
                        configure.getDistanceFromTwoLocation(current_location, destination_location).then((distance) => {
                            var estimated_time = 0;
                            var eta_timeout = 10000
                            if ((source_location.lat !== 0) && (source_location.lon !== 0) &&
                                (current_location.lat) && (current_location.lat !== 0) && (current_location.lon !== 0) &&
                                (destination_location.lat) && (destination_location.lat !== 0) && (destination_location.lon !== 0)) {
                                estimated_time = (isFinite(distance) && isFinite(ambulance_speed)) ? (distance / ambulance_speed) : 0;
                                estimated_time = (isFinite(estimated_time)) ? (estimated_time * 60) : 0;
                                covered_distance = (isFinite(complete_distance)) ? (complete_distance) : 0;
                            }
                            if (estimated_time <= 10 && ambulance_data[0].aocRequestsDetail && ( ambulance_data[0].aocRequestsDetail.request_status == "COME_BACK_TO_BASE_HOSPITAL" || ambulance_data[0].aocRequestsDetail.request_status == "ARRIVAL_AT_BASE_HOSPITAL") && !eta_timeout_array[ambulance_data[0]._id] ) {
                                    configure.sendPushnotification((ambulance_data[0] && ambulance_data[0].aocRequestsDetail) ? ambulance_data[0].aocRequestsDetail._id : "", ambulance_data[0]._id, "AMBULACNE_NEAR_ABOUT_SCENE")
                                    eta_timeout_array[ambulance_data[0]._id] = setTimeout(() => {
                                    }, eta_timeout);
                            }
                            // if(Number(req.body.ambulance_id == '291')){
                            // console.log('source_location', source_location, 'current_location', current_location, 'destination_location', destination_location);
                            // console.log('estimated_time'+estimated_time, 'distance'+distance, 'ambulance_speed'+ambulance_speed, 'covered_distance'+covered_distance);
                            // }

                            var avg = (ambulance_tracking_data.avg_speed + Number(req.body.tracking_speed)) / 2;

                            if (avg > 80 && avg < 120)
                                current_state = 'ORANGE';
                            else if (avg > 120)
                                current_state = 'RED';

                            var AmbulanceTrackingsDetail = {};

                            AmbulanceTrackingsDetail['$set'] = {
                                location: {
                                    lat: Number(req.body.tracking_latitude),
                                    lon: Number(req.body.tracking_longitude)
                                },
                                speed: Math.ceil((Number(req.body.tracking_speed) > 1) ? Number(req.body.tracking_speed) : 0),
                                avg_speed: Number(avg).toFixed(2),
                                heading: Number(req.body.tracking_heading) ? Number(req.body.tracking_heading) : 0,
                                count_datetime: current_datetime,
                                state: String(current_state),
                                estimated_time: (Number(estimated_time) > 0) ? Number(estimated_time) : 0,
                                covered_distance: (Number(covered_distance) > 0) ? Number(covered_distance) : 0,
                            };

                            AmbulanceTrackingsDetail['$unset'] = {};

                            if(speed_above_120) {
                                AmbulanceTrackingsDetail['$set']['speed_above_120'] = speed_above_120;
                                AmbulanceTrackingsDetail['$set']['speed_above_80'] = speed_above_80;
                            }
                            else if(speed_above_80) {
                                AmbulanceTrackingsDetail['$set']['speed_above_80'] = speed_above_80;
                                AmbulanceTrackingsDetail['$unset']['speed_above_120'] = 1;
                            }
                            else {
                                AmbulanceTrackingsDetail['$unset']['speed_above_80'] = 1;
                                AmbulanceTrackingsDetail['$unset']['speed_above_120'] = 1;
                            }
                            tracking_speed = ((+ambulance_tracking_data.speed + +ambulance_speed) / 2)
                            AmbulanceTrackings.update({ _id: ObjectId(ambulance_tracking_data._id) }, AmbulanceTrackingsDetail, { new: true }).then(ambulance_trackings_data => {
                                // redisClient.hmset(String(ambulance_data[0]._id), '_id', String(ambulance_data[0]._id));
                                // redisClient.hmset(String(ambulance_data[0]._id), 'ambulance_box_code', String(ambulance_data[0].ambulance_box_code));
                                // redisClient.hmset(String(ambulance_data[0]._id), 'ambulanceTrackingsDetail', JSON.stringify(AmbulanceTrackingsDetail['$set']));
                            }).catch((err) => console.log(err));

                            req.body.estimated_time = (Number(estimated_time) > 0) ? Number(estimated_time) : 0;
                            socket.emit(String(ambulance_data[0]._id), req.body); // FOR USER PANEL TRACKING...
                            socket.emit("tracking", req.body); // FOR USER PANEL TRACKING...
                        })
                    })
                } else {
                    var ambulance_trackings = new AmbulanceTrackings({
                        ambulance_id: ObjectId(ambulance_data[0]._id),
                        location: {
                            lat: Number(req.body.tracking_latitude),
                            lon: Number(req.body.tracking_longitude)
                        },
                        speed: Math.ceil(Number(req.body.tracking_speed)),
                        heading: Number(req.body.tracking_heading) ? Number(req.body.tracking_heading) : 0,
                        count_datetime: current_datetime,
                        state: String(current_state)
                    })

                    ambulance_trackings
                        .save(ambulance_trackings)
                        .then().catch((err) => console.log(err))

                    req.body.estimated_time = Number(0);
                    socket.emit(String(ambulance_data[0]._id), req.body); // FOR USER PANEL TRACKING...
					socket.emit("tracking", req.body); // FOR USER PANEL TRACKING...
                }
            })
            res.status(200).send({success :true});
        } else {
            res.status(201).send({
                message:
                    "Ambulance not found."
            });
        }
    })
};