const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const Drivers = db.drivers;
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
exports.getDriversList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);

    var getDriversListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    {
                        '$or': [
                            { driver_name: { $regex: String(req.body.searchValue), $options: 'i' } },
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

    Drivers.aggregate(getDriversListCondition)
        .then(count => {
            getDriversListCondition.splice(-1, 1);
            getDriversListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
            getDriversListCondition.push({ "$skip": Number((currentPage - 1) * pageSize) });
            getDriversListCondition.push({ "$limit": Number(pageSize) });
            Drivers.aggregate(getDriversListCondition)
                .then(data => {
                    var response = {};
                    response['count'] = (count[0]) ? count[0].count : 0;
                    response['data'] = data;
                    res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
                })
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating Drivers.",req.headers.isencryption));
        });
};


exports.updateDriverDetail = (req, res) => {
    var response = {};
    if (req.body._id !== 'null') {
        var driver = {
            first_name: String(req.body.first_name),
            last_name: String(req.body.last_name),
            birthdate : new Date(req.body.birthdate),
            hospital_id: ObjectId(req.body.hospital_id),
            email: String(req.body.email),
            password: String(req.body.password),
            email: String(req.body.email),
            phone: req.body.phone,
            gender: req.body.gender,
            // about :req.body.about,
            // remark :req.body.remark,
            // shift :req.body.shift,
            isactive: 1,
        }

        Drivers.findOneAndUpdate({ _id: req.body._id }, { $set: driver })
            .then(async data => {
                if (req.files && req.files.length) {
                        ProfileImageURL = await configure.fsUpload(data._id, 'driverProfile', req.files[0]);
                        driver.userProfile = ProfileImageURL;
                        Drivers.findOneAndUpdate({ _id: req.body._id }, { $set: { profile_picture: ProfileImageURL } }).then((data, err) => {
                            console.log(err);
                        })
                    // let user_image =  configure.fsUpload(data._id, 'userProfile',);
                }
                if (!data) {
                    res.status(404).send(configure.apiResp(false, 404, {},"Driver data not found !.",req.headers.isencryption));
                } else {
                    response['data'] = data;
                    response['success'] = true;
                    res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
                }
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating Drivers.",req.headers.isencryption));
            });
    } else {

        var driver = new Drivers({
            first_name: String(req.body.first_name),
            last_name: String(req.body.last_name),
            phone: req.body.phone,
            zone_id: ObjectId(req.body.zone_id),
            hospital_id: ObjectId(req.body.hospital_id),
            isactive: String(req.body.isactive),
            is_scan: String(req.body.is_scan),
            email: String(req.body.email),
            birthdate: Date(req.body.birthdate),
            isactive: (req.body.isactive) ? 1 : 1,
            password: String(req.body.password),
            gender: Number(req.body.gender)
        })

        driver
            .save(driver)
            .then(data => {
                // if (req.files && req.files.length) configure.fsUpload(data._id, 'driverProfile', req.files[0]);
                if (req.files && req.files.length) {
                    configure.random(4, 'Number').then(async (ran) => {
                        var ProfileImage = String(Date.now() + ran);
                       let  ProfileImageURL = await configure.fsUpload(data._id, 'driverProfile', req.files[0]);
                        Drivers.findOneAndUpdate({ _id: data._id }, { $set: { profile_picture: ProfileImageURL } }).then((data, err) => {
                            console.log(err);
                        })
                    })
                    // let user_image =  configure.fsUpload(data._id, 'userProfile',);
                }
                var response = {};
                response['success'] = true;
                response['data'] = data;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating Drivers.",req.headers.isencryption));
            });
    }
};