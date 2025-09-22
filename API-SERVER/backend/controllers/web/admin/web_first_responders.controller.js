const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const First_Responders = db.first_responders;
exports.getFirstRespondersList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);

    var getFirst_RespondersListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    {
                        '$or': [
                            { first_name: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { last_name: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { email: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { phone: { $regex: String(req.body.searchValue), $options: 'i' } },
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
            $unwind: {
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
            '$project': {
                "_id": 1,
                "first_name": 1,
                "last_name": 1,
                "email": 1,
                "phone": 1,
                "password": 1,
                "birthdate": 1,
                "gender": 1,
                "profile_picture": 1,
                "hospital_id": 1,
                // device_type: { type: String, default: '' },
                // device_token: { type: String, default: '' },
                // app_version: { type: String, default: '' },
                "is_online": 1,
                "isactive": 1,
                "isdeleted": 1,
                "zone_id": "$hospitalDetails.zone_id",
                'hospital_fullname' : '$hospitalDetails.full_name',
                'zone_name' : '$zoneDetail.name1'

            }
        },
        { '$count': "count" }
    ]

    First_Responders.aggregate(getFirst_RespondersListCondition)
        .then(count => {
            getFirst_RespondersListCondition.splice(-1, 1);
            getFirst_RespondersListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
            getFirst_RespondersListCondition.push({ "$skip": Number((currentPage - 1) * pageSize) });
            getFirst_RespondersListCondition.push({ "$limit": Number(pageSize) });
            First_Responders.aggregate(getFirst_RespondersListCondition)
                .then(data => {
                    var response = {};
                    response['count'] = (count[0]) ? count[0].count : 0;
                    response['data'] = data;
                    res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
                })
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving First_Responders.",req.headers.isencryption));
        });
};

exports.updateFirstResponderDetail = (req, res) => {
    var response = {};
    if (req.body._id !== 'null') {
        var first_responder = {
            first_name: String(req.body.first_name),
            last_name: String(req.body.last_name),
            phone: String(req.body.phone),
            // zone_id: ObjectId(req.body.zone_id),
            hospital_id: ObjectId(req.body.hospital_id),
            isactive: (req.body.isactive == 1) ? 1 : 1,
            // is_scan :String(req.body.is_scan),
            email: String(req.body.email),
            birthdate : new Date(req.body.birthdate),
            gender: req.body.gender,
            password: req.body.password
        }

        First_Responders.findOneAndUpdate({ _id: req.body._id }, { $set: first_responder })
            .then(async data => {
                if (req.files && req.files.length) {
                        ProfileImageURL = await configure.fsUpload(data._id, 'firstResponderProfile', req.files[0]);
                        first_responder.userProfile = ProfileImageURL;
                        First_Responders.findOneAndUpdate({ _id: req.body._id }, { $set: { profile_picture: ProfileImageURL } }).then((data, err) => {
                            console.log(err);
                    })
                    // let user_image =  configure.fsUpload(data._id, 'userProfile',);
                }
                if (!data) {
                    res.status(404).send(configure.apiResp(false, 404, {},"First Responders data not found !.",req.headers.isencryption));
                } else {
                    response['data'] = data;
                    response['success'] = true;
                    res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
                }
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating First_Responders.",req.headers.isencryption));
            });
    } else {

        var first_responder = new First_Responders({
            first_name: String(req.body.first_name),
            last_name: String(req.body.last_name),
            phone: String(req.body.phone),
            zone_id: ObjectId(req.body.zone_id),
            hospital_id: ObjectId(req.body.hospital_id),
            isactive: String(req.body.isactive),
            is_scan: String(req.body.is_scan),
            email: String(req.body.email),
            birthdate: Date(req.body.birthdate),
            isactive: (req.body.isactive == 1) ? 1 : 1,
            gender: req.body.gender,
            password: req.body.password
        })

        first_responder
            .save(first_responder)
            .then(async data => {
                if(req.files && req.files.length >0){
               let ProfileImageURL = await configure.fsUpload(data._id, 'firstResponderProfile', req.files[0]);
                first_responder.userProfile = ProfileImageURL;
                First_Responders.findOneAndUpdate({ _id: data._id }, { $set: { profile_picture: ProfileImageURL } }).then((data, err) => {
                    console.log(err);
                })              
            }
              var response = {};
                response['success'] = true;
                response['data'] = data;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating First_Responders.",req.headers.isencryption));
            });
    }
};