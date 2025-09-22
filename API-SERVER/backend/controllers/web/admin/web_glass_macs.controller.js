const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const GlassMacs = db.glass_macs;

exports.getGlassMacsList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getGlassMacsListCondition = [
        {
            '$match': {
                "$and": [
                    { "isactive": 1 },
                    { "isdeleted": false },
                    {
                        '$or': [
                            { name: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { brand_name: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { mac_address: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { model: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { manufacturer: { $regex: String(req.body.searchValue), $options: 'i' } },
                        ]
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'hospitals', 
                'localField': 'hospital_id', 
                'foreignField': '_id', 
                'as': 'hospitalDetails'
            }
        },
        { 
            '$unwind': {
                "path": "$hospitalDetails",
                "preserveNullAndEmptyArrays": true
            } 
        },
        {
            '$lookup': {
                'from': 'aoc_zones',
                'localField': 'hospitalDetails.zone_id',
                'foreignField': '_id',
                'as': 'zoneDetail'
            },
        },
        {
            '$unwind': {
                "path": "$zoneDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "aoc_requests",
                let: {
                    glass_id: "$_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$glass_id",
                                            "$$glass_id"
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
                as: "aocRequestDetail"
            }
        },
        {
            '$unwind': {
                "path": "$aocRequestDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'ambulances', 
                'localField': 'aocRequestDetail.ambulance_id', 
                'foreignField': '_id', 
                'as': 'ambulanceDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulanceDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        { 
            '$project': {
            "_id": 1,
            "ambulance_id": 1,
            "description": 1,
            "createdAt": 1,
            "updatedAt": 1,
            "isactive": 1,
            "name": 1,
            "mac_address": 1,
            "profile_picture": 1,
            "hospital_id": 1,
            "ambulance_box_code" : {$ifNull : [String("$ambulanceDetail.ambulance_box_code") ,'']},
            // device_type: { type: String, default: '' },
            // device_token: { type: String, default: '' },
            // app_version: { type: String, default: '' },
            "is_online": 1 ,
            "isactive": 1 ,
            "isdeleted" :1,
            "zone_id" : "$hospitalDetails.zone_id",
            'hospital_fullname' : '$hospitalDetails.full_name',
            'zone_name' : '$zoneDetail.name1'
         
            }
        },
        { '$count': "count" }
    ]
    
    GlassMacs.aggregate(getGlassMacsListCondition)
    .then(count => {
        getGlassMacsListCondition.splice(-1,1);
        getGlassMacsListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getGlassMacsListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getGlassMacsListCondition.push({ "$limit": Number(pageSize) });
        GlassMacs.aggregate(getGlassMacsListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving GlassMacs.",req.headers.isencryption));
    });
};

exports.updateGlassMecDetail = (req,res)=>{
    var response = {};
    if(req.body._id !== 'null' && req.body._id !== null){
        var glass_mac = {
            description: String(req.body.description),
            name: String(req.body.name),
            mac_address: String(req.body.mac_address),
            hospital_id: ObjectId(req.body.hospital_id),
            isactive:req.body.isactive,
        }
     
        GlassMacs.findOneAndUpdate({_id: req.body._id}, { $set: glass_mac })
        .then(data => {
            if (!data) {
                res.status(404).send(configure.apiResp(false, 404, {},"GlassMacs data not found !.",req.headers.isencryption));

            } else {
                response['data'] = data;
                response['success'] = true;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            }
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating GlassMacs.",req.headers.isencryption));
        });
    }else{

        var glass_mac = new GlassMacs({
            description: String(req.body.description),
            name: String(req.body.name),
            mac_address: String(req.body.mac_address),
            hospital_id: ObjectId(req.body.hospital_id),
            isactive:1,
        })
        
        glass_mac
        .save(glass_mac)
        .then(data => {
            var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating GlassMacs.",req.headers.isencryption));
        });
    }
}