const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const TrackApps = db.track_apps;
const Ambulances = db.ambulances;


// exports.getWebTrackAppList = (req, res) => {
    
//     var query = {
//         $or: [
//             { ambulance_id: { $type: 10 } },
//             // { $ne:null },
//             { ambulance_id: { $exists: false } },
//             {$eq : {ambulance_id :ObjectId(req.body.ambulance_id)}}
//         ]
//     }
//     TrackApps.find(query).then(data => {
//         res.status(200).send({ data: data })
//     })
// }

exports.getWebTrackAppList = (req, res) => {
    var trackAppCondition = [{
        $match: {
            '$or': [
                { ambulance_id: { $exists: false } },
            ],
        }
    }];
    if(req.body.ambulance_id && req.body.ambulance_id !== 'null')
    trackAppCondition[0]['$match']['$or'].push({ ambulance_id :{ $eq :ObjectId(req.body.ambulance_id) } })

    TrackApps.aggregate(trackAppCondition).then(data => {
        let resp = {};
        resp['data'] = data;
        res.send(configure.apiResp(true, 200, resp, '', req.headers.isencryption));
    })
}


exports.registerWebEjunApp = (req, res) => {
    TrackApps.findOne({ device_code: String(req.body.device_code) }).then(track_data => {
        if (track_data) {
            var resp = {};

            if (track_data.ambulance_id) {
                Ambulances.aggregate([{
                    '$match': {
                        "$and": [
                            { "_id": ObjectId(track_data.ambulance_id) }
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
                    '$lookup': {
                        'from': 'aoc_zones',
                        'localField': 'hospitalsDetail.zone_id',
                        'foreignField': '_id',
                        'as': 'zonesDetail'
                    },
                },
                {
                    '$unwind': {
                        "path": "$zonesDetail",
                        "preserveNullAndEmptyArrays": true
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
                    '$project': {
                        "_id": 1,
                        "name1": 1,
                        "name2": 1,
                        "ambulance_box_code": 1,
                        "is_assign": {
                            $cond: [
                                { $ifNull: ['$aocRequestsDetail._id', false] },
                                1,
                                0
                            ]
                        },
                        "hospitalsDetail": {
                            '_id': 1,
                            'full_name': 1,
                            'name1': 1,
                            'name2': 1,
                        },
                        "zonesDetail": {
                            '_id': 1,
                            'name1': 1,
                            'name2': 1,
                        }
                    }
                }]).then((data) => {
                    resp['ambulancesDetail'] = data[0];
                    resp['device_code'] = track_data['device_code'];
                    resp['mac_address'] = track_data['mac_address'];
                    resp['_id'] = track_data['_id'];
                    res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
                })
            } else {
                resp = track_data;
                res.send(configure.apiResp(false, 200, resp, 'Ambulance not Assigned , Please contact Admin !!',req.headers.isencryption));
            }
        } else {
            let track_app = new TrackApps({
                'device_code': String(req.body.device_code),
                'mac_address': String(req.body.mac_address),
                'device_name': String(req.body.device_name),
                'device_type': String(req.body.device_type),
            })

            track_app
                .save(track_app)
                .then(e => {
                    res.send(configure.apiResp(false, 200, resp, 'Register Successfully.',req.headers.isencryption));
                });
        }
    })
}