const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const AocZones = db.aoc_zones;
const Ambulances = db.ambulances;
const AmbulanceTrackingHistories = db.ambulance_tracking_histories;
const Hospitals = db.hospitals;

exports.getAllAocZonesList = (req, res) => {
    var getAllAocZonesListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    { "isactive": 1 },
                ]
            }
        },
        {
            '$project': {
                '_id': 1,
                'name1': 1,
                'name2': 1,
                'number': 1,
            }
        }
    ]

    AocZones.aggregate(getAllAocZonesListCondition)
    .then(data => {
        var response = {};
        response['data'] = data;
        res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
    }).catch(err=>{
        res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
    })
};

exports.getZoneHospitalsList = (req, res) => {
    var getHospitalsListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    { "isactive": 1 },
                ]
            }
        },
    ]
    if (req.body.zone_id) {
        getHospitalsListCondition.push(
            {
                '$match':
                    { "zone_id": { "$eq": ObjectId(req.body.zone_id) } }
            }
        )
    }

    if (!req.body.zone_id && req.body.user_id) {
        getHospitalsListCondition.push(
            {
                '$lookup': {
                    'from': 'aoc_users',
                    'localField': '_id',
                    'foreignField': 'hospital_ids',
                    'as': 'userDetail'
                }
            },
            {
                '$unwind': {
                    "path": "$userDetail",
                }
            },
            {
                 "$match": {
                    "userDetail._id": ObjectId(req.body.user_id),
                  },
            },
            {
                "$group": {
                    "_id":'$userDetail._id',
                    "name1": { $first: "$name1" },
                    "name2": { $first: "$name2" },
                    "userDetail" : { $first: "$userDetail" },
            }
            },
            // {'$unwind' :'$userDetail'},
            // {
            //     "$match": { "_id": { "$in": '$userDetail.hospital_ids' } } 
              
            // },
            {
                '$lookup': {
                    'from': 'hospitals',
                    'localField': 'userDetail.hospital_ids',
                    'foreignField': '_id',
                    'as': 'hospitalDetail'
                }
            },
            {
                '$unwind': {
                    "path": "$hospitalDetail",
                    "preserveNullAndEmptyArrays": false
                }
            },
            {
                '$project': {
                    '_id': '$hospitalDetail._id',
                    'name1': '$hospitalDetail.name1',
                    'name2': '$hospitalDetail.name2',
                    'number': 1,
                    // hospitalDetail:1,
                    // userId:1,
                    // 'userDetail':{$ifNull : ['$userDetail',{}]}
                }
            }
        )
    }
    if (req.body.zone_id && req.body.user_id) {

        getHospitalsListCondition.push(
        {
            '$project': {
                '_id':1,
                'name1':1,
                'name2':1,
                'number': 1,
                // hospitalDetail:1,
                // userId:1,
                // 'userDetail':{$ifNull : ['$userDetail',{}]}
            }
        })
    }
    Hospitals.aggregate(getHospitalsListCondition)
    .then(data => {
        var response = {};
        response['data'] = data;
        res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
    }).catch(err=>{
        res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
    })
};

exports.getHospitalAmbulancesList = (req, res) => {
    var getAmbulancesListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    { "isactive": 1 },
                    { "hospital_id": { "$eq": ObjectId(req.body.hospital_id) } }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'hospitals', 
                'localField': 'hospital_id',
                'foreignField':  '_id', 
                'as': 'hospitalDetails'
            }
        },
        { "$unwind": {
            "path": "$hospitalDetails",
            "preserveNullAndEmptyArrays": true
        } },
        {
            '$project': {
                '_id': 1,
                'name1': 1,
                'name2': 1,
                'number': 1,
                "hospitalDetails":
                {
                    '_id':1,
                    'name1':1,
                    'logo_image':1,
                    'logo_path' :  configure.fsUploadURL('hospitalLogo'),
                }
            }
        }
    ]

    Ambulances.aggregate(getAmbulancesListCondition)
    .then(data => {
        var response = {};
        response['data'] = data;
        res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
    }).catch(err=>{
        res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
    })
};

exports.postAmbulanceSpeedReport = (req,res)=>{
    let ambulanceSpeedReportCondition = [
        {
            '$match': { "_id": { $eq: ObjectId(req.body.hospital_id) } } 
        },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': '_id',
                'foreignField': 'hospital_id',
                'as': 'ambulancesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail",
                "preserveNullAndEmptyArrays": false
            }
        },
    ];

    if(req.body.ambulance_id && req.body.ambulance_id !== undefined && req.body.ambulance_id !== 'undefined' && req.body.ambulance_id !== ''){
        ambulanceSpeedReportCondition.push({
            '$match': { "ambulancesDetail._id": { $eq: ObjectId(req.body.ambulance_id) } }
        })
    }

    var speed_cond = "$speed_above_80";

    if(req.body.speed_limit && req.body.speed_limit !== 'undefined'){
        speed_cond = (req.body.speed_limit == 'speed_above_120')?"$speed_above_120":"$speed_above_80";
    }

    ambulanceSpeedReportCondition.push({
        $lookup: {
            from: "ambulance_tracking_histories",
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
                                    $gte: [
                                        speed_cond,
                                        null
                                    ]
                                },
                            ]
                        }
                    }
                }
            ],
            as: "ambulancesDetail.ambulanceTrackingHistoriesDetail"
        }
    },
    {
        '$unwind': {
            "path": "$ambulancesDetail.ambulanceTrackingHistoriesDetail",
            "preserveNullAndEmptyArrays": false
        }
    })

    if(req.body.start_date && req.body.start_date !== '' && req.body.start_date !== 'undefined' ){
        ambulanceSpeedReportCondition[ambulanceSpeedReportCondition.length-2]['$lookup']['pipeline'][0]['$match']['$expr']['$and'].push({
            $gte: [
                "$createdAt",
                new Date(req.body.start_date)
            ]
        },
        {
            $lte: [
                "$createdAt",
                new Date(req.body.end_date)
            ]
        })
    }

    var speed_limit = (req.body.speed_limit == 'speed_above_120')?"$ambulancesDetail.ambulanceTrackingHistoriesDetail.speed_above_120":"$ambulancesDetail.ambulanceTrackingHistoriesDetail.speed_above_80";

    ambulanceSpeedReportCondition.push(
        {
            "$project": {
                "_id": 0,
                "speed_above_type": {
                    $cond: [
                        { $ifNull: ['$ambulancesDetail.ambulanceTrackingHistoriesDetail.speed_above_80', false] },
                        "speed_above_80",
                        "speed_above_120"
                    ]
                },
                "ambulancesDetail": {
                    "name1": 1,
                    "name2": 1,
                    "ambulance_box_code": 1,
                    "ambulanceTrackingHistoriesDetail": 1
                },
            }
        },
        {
            "$group": {
                    "_id": speed_limit,
                    "speed_above_type": { $first: "$speed_above_type" },
                    "name1": { $first: "$ambulancesDetail.name1" },
                    "name2": { $first: "$ambulancesDetail.name2" },
                    "ambulance_box_code": { $first: "$ambulancesDetail.ambulance_box_code" },
                    "start_speed": { $first: "$ambulancesDetail.ambulanceTrackingHistoriesDetail.speed" },
                    "start_speed_time": { $first: "$ambulancesDetail.ambulanceTrackingHistoriesDetail.createdAt" },
                    "end_speed": { $last: "$ambulancesDetail.ambulanceTrackingHistoriesDetail.speed" },
                    "end_speed_time": { $last: "$ambulancesDetail.ambulanceTrackingHistoriesDetail.createdAt" },
            }
        },
        { '$count': "count" }
    )

    Hospitals.aggregate(ambulanceSpeedReportCondition)
    .then(count=>{
        let current_page= req.body.current_page;
        let page_size = req.body.page_size;
        ambulanceSpeedReportCondition.splice(-1,1);
        ambulanceSpeedReportCondition.push({ $sort: { "start_speed_time": -1 } });
        ambulanceSpeedReportCondition.push({ "$skip": Number((current_page - 1) * page_size) });
        ambulanceSpeedReportCondition.push({ "$limit": Number(page_size) });
        Hospitals.aggregate(ambulanceSpeedReportCondition)
        .then(data=>{
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;

            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
        }).catch(err=>{
             res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
        })
    }).catch(err=>{
         res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
    })

}

exports.postAmbulanceSpeedReportDetail = (req,res)=>{
    let ambulanceSpeedReportDetailCondition = [];
   
    if(req.body.speed_above_type == 'speed_above_80'){
        ambulanceSpeedReportDetailCondition.push({'$match': { "speed_above_80": { $eq: ObjectId(req.body.speed_above_id) } } });
    } else {
        ambulanceSpeedReportDetailCondition.push({'$match': { "speed_above_120": { $eq: ObjectId(req.body.speed_above_id) } } });
    }
    ambulanceSpeedReportDetailCondition.push(
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'ambulance_id',
                'foreignField': '_id',
                'as': 'ambulancesDetails'
            }
        },
        {
            "$unwind": {
                "path": "$ambulancesDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals',
                'localField': 'ambulancesDetails.hospital_id',
                'foreignField': '_id',
                'as': 'ambulancesDetails.hospitalDetails'
            }
        },
        {
            "$unwind": {
                "path": "$ambulancesDetails.hospitalDetails",
                "preserveNullAndEmptyArrays": true
            }
        })
    ambulanceSpeedReportDetailCondition.push({
        '$project': {
            "speed": 1,
            "createdAt": 1,
            "ambulancesDetails": {
                "hospitalDetails":
                {
                    '_id': 1,
                    'name1': 1,
                    'logo_image': 1,
                    'logo_path': configure.fsUploadURL('hospitalLogo'),
                }
            }
        }
    });

    // ambulanceSpeedReportDetailCondition.push({ '$count': "count" });

    // AmbulanceTrackingHistories.aggregate(ambulanceSpeedReportDetailCondition)
    // .then(count=>{
        let current_page= req.body.current_page;
        let page_size = req.body.page_size;
        // ambulanceSpeedReportDetailCondition.splice(-1,1);
        ambulanceSpeedReportDetailCondition.push({ "$sort": { "createdAt": -1 } });
        ambulanceSpeedReportDetailCondition.push({ "$skip": Number((current_page - 1) * page_size) });
        ambulanceSpeedReportDetailCondition.push({ "$limit": Number(page_size) });
        
        AmbulanceTrackingHistories.aggregate(ambulanceSpeedReportDetailCondition)
        .then(data=>{

            var response = {};
            response['count'] = data.length;
            response['data'] = data;

            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));
        }).catch(err=>{
             res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
        })
    // }).catch(err=>{
    //      res.status(500).send(configure.apiResp(false, 500, {}, err,req.headers.isencryption));
    // })
}