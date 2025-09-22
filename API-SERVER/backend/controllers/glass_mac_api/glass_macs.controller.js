const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const GlassMacs = db.glass_macs;
const AocRequests = db.aoc_requests;


exports.postGlassMacsRegister = (req, res) => {
    GlassMacs.findOne({mac_address: String(req.body.mac_address)})
    .then(data => {
        var resp = {};
        if(data){
            var resp = {};
            resp['location'] =  data['location'];
            resp['name'] =  data['name'];
            resp['mac_address'] =  data['mac_address'];
            resp['is_online'] =  data['is_online'];
            resp['description'] =  data['description'];
            resp['isdeleted'] =  data['isdeleted'];
            resp['type'] =  data['type'];
            resp['token'] =  data['token'];
            resp['app_version'] =  data['app_version'];
            resp['brand_name'] =  data['brand_name'];
            resp['model'] =  data['model'];
            resp['manufacturer'] =  data['manufacturer'];
            resp['createdAt'] =  data['createdAt'];
            resp['_id'] =  data['_id'];
            resp['rtmp_url'] = 'rtmp://stm.aocopt.com:1935/live/temp'+'_'+String(data._id).slice((String(data._id)).length - 5);
            resp['glass_mac_code'] = String(data._id).slice((String(data._id)).length - 5);
            res.send(configure.apiResp(true, 200, resp, ''));
        } else {
            var glass_macs = new GlassMacs({
                name: String(req.body.brand_name) + ' ' + String(req.body.model),
                description: String(req.body.manufacturer),
                mac_address: String(req.body.mac_address),
                location: {
                    lat: Number(req.body.lat),
                    lon: Number(req.body.lon)
                },
                type: String(req.body.type),
                model: String(req.body.model),
                token: String(req.body.token),
                app_version: String(req.body.app_version),
                brand_name: String(req.body.brand_name),
                manufacturer: String(req.body.manufacturer)
            })

            glass_macs
            .save(glass_macs)
            .then(data => {
                resp['location'] =  data['location'];
                resp['name'] =  data['name'];
                resp['mac_address'] =  data['mac_address'];
                resp['is_online'] =  data['is_online'];
                resp['description'] =  data['description'];
                resp['isdeleted'] =  data['isdeleted'];
                resp['type'] =  data['type'];
                resp['token'] =  data['token'];
                resp['app_version'] =  data['app_version'];
                resp['brand_name'] =  data['brand_name'];
                resp['model'] =  data['model'];
                resp['manufacturer'] =  data['manufacturer'];
                resp['createdAt'] =  data['createdAt'];
                resp['_id'] =  data['_id'];
                resp['rtmp_url'] = 
                resp['glass_mac_code'] = String(data._id).slice((String(data._id)).length - 5);
                data = {...data, 
                    rtmp_url: 'rtmp://stm.aocopt.com:1935/live/temp'+'_'+String(data._id).slice((String(data._id)).length - 5),
                    glass_mac_code: String(data._id).slice((String(data._id)).length - 5)
                }
                res.send(configure.apiResp(true, 200, resp, ''));
            }).catch(err => {
                res.status(500).send({
                    message:
                    err.message || "Some error occurred while register the Glass Macs."
                });
            });
        }
        resp['success'] = true;
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while register the Glass Macs."
        });
    });

};

exports.postGlassMacsStatusChange = (req, res) => {
    GlassMacs.findOneAndUpdate({_id: ObjectId(req.body.glass_mac_id)}, { $set: {is_online: Number(req.body.is_online)}}, { new: true })
    .then(data => {
        if(data){
            var postGlassMacsStatusChange = [
                { '$match': 
                    {
                        "_id": ObjectId(req.body.glass_mac_id)
                    }
                },
                { '$lookup': 
                    {
                        from: "aoc_requests",
                        let: {
                            glass_mac_id: "$_id",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$glass_id",
                                                    "$$glass_mac_id"
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
                    '$lookup': {
                        'from': 'ambulances',
                        'localField': 'aocRequestsDetail.ambulance_id',
                        'foreignField': '_id',
                        'as': 'aocRequestsDetail.ambulancesDetail'
                    },
                },
                {
                    '$unwind': {
                        "path": "$aocRequestsDetail.ambulancesDetail",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    '$lookup': {
                        'from': 'patient_monitors',
                        'localField': 'aocRequestsDetail.moniter_id',
                        'foreignField': '_id',
                        'as': 'aocRequestsDetail.patientMonitorsDetail'
                    },
                },
                {
                    '$unwind': {
                        "path": "$aocRequestsDetail.patientMonitorsDetail",
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
                    '$project': {
                        "_id":1,
                        "name": 1,
                        "mac_address": 1,
                        "is_online": 1,
                        "description": 1,
                        "isactive": 1,
                        "isdeleted": 1,
                        "type": 1,
                        "token": 1,
                        "app_version": 1,
                        "brand_name": 1,
                        "manufacturer": 1,
                        "location": 1,
                        "hospital_id":1,
                        "aocRequestsDetail": {
                            "_id": 1,
                            "ambulancesDetail": {
                                "name1": 1,
                                "name2": 1,
                                "ambulance_box_code": 1
                            },
                            "request_code": 1,
                            "patientMonitorsDetail": 1,
                            "patientRequestsDetail": {
                                "severity_level": 1,
                                "patientsDetail": 1
                            }
                        }
                    }
                }
            ];

            GlassMacs.aggregate(postGlassMacsStatusChange)
            .then(data => {
                data[0] = {...data[0], glass_mac_code: String(data[0]._id).slice((String(data[0]._id)).length - 5)}
                if(Number(req.body.is_online)){
                    let query = {
                        glass_id :{$eq: ObjectId(data[0]['_id'])},
                        request_status : {$ne : "COMPLETED"},
                        request_status :{$ne : "CANCELED"}
                    }
                    AocRequests.findOne(query).then(request_data=>{
                        // configure.statusChangePushNotification(request_data['_id'],{glass_id :data[0]['_id']} , "Glass Stauts Update",  "Glass is Online")
                        configure.postGlassStatusNotification(request_data ? request_data['_id']:null,data[0]['_id'], "GLASS_MACS_STATUS",  "GLASS_MACS_STATUS_ONLINE",configure.notificationSound.GLASS_MACS_STATUS_ONLINE)
                    }) 

                    res.send(configure.apiResp(true, 200, data[0], ''));
                }else{
                    let query = {
                        glass_id :{$eq: ObjectId(data[0]['_id'])},
                    }
                    AocRequests.find(query).sort({updatedAt :-1}).then(request_data=>{
                    // configure.statusChangePushNotification(request_data[0]['_id'],{glass_id :data['glass_id']} , "Glass Stauts Update",  "Glass is Offline")
                    configure.postGlassStatusNotification(request_data[0]['_id'] ? request_data[0]['_id'] :null, data[0]['_id'],"GLASS_MACS_STATUS",  "GLASS_MACS_STATUS_OFFLINE",configure.notificationSound.GLASS_MACS_STATUS_OFFLINE)

                    res.send(configure.apiResp(true, 200, {}, ''));
                    })

                }
            })
            .catch(err => {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving Glass mac detail."
                });
            });
        } else {
            res.status(201).send({
                message: "Glass not found."
            });
        }
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while status change the Glass Macs."
        });
    });
}