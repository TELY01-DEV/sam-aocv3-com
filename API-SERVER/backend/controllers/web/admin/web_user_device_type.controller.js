const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Devices =db.devices;

const DevicesTypes = db.device_types;



exports.getDeviceTypeList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    var getDeviceTypeListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    {
                        '$or': [
                            { name: { $regex: String(req.body.searchValue), $options: 'i' } },
                        ]
                    }
                ]
            }
        },
        { '$count': "count" }
    ]
    
    DevicesTypes.aggregate(getDeviceTypeListCondition)
    .then(count => {
        getDeviceTypeListCondition.splice(-1,1);
        getDeviceTypeListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getDeviceTypeListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getDeviceTypeListCondition.push({ "$limit": Number(pageSize) });
        DevicesTypes.aggregate(getDeviceTypeListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retriving DevicesTypes.",req.headers.isencryption));
    });
};


exports.postDevicesTypesList = (req, res) => {
    var getDevicesTypesListCondition = [
        {
            '$match': {
                "$and": [
                    { "isactive": 1 },
                    { "isdeleted": false },
                ]
            }
        },
        {
            '$project': {
                "_id": 1,
                "name": 1,
                "model": 1,
            }
        },
    ]
    
    DevicesTypes.aggregate(getDevicesTypesListCondition)
    .then(data => {
        var resp = {};
        resp['data'] = data;
        res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retriving DevicesTypes.",req.headers.isencryption));

    });
};


exports.updateDeviceTypeDetail = (req, res) => {
    var response = {};
    if (req.body._id !== 'null'&& req.body._id !== null ) {
        var device_type = {
            name: String(req.body.name),
            // profile_picture: String(req.body.profile_picture),
            // device_type_id :  ObjectId(req.body.device_type_id),
            brand_name:String(req.body.brand_name),
            isactive :req.body.isactive,
            model :req.body.model,
            // hospital_id :ObjectId(req.body.hospital_id),
            // remark :String(req.body.remark)
        }

        DevicesTypes.findOneAndUpdate({ _id: req.body._id }, { $set: device_type })
            .then(data => {
        
                if (!data) {
                    res.status(404).send(configure.apiResp(false, 404, {},"Device data not found !.",req.headers.isencryption));

                } else {
                    response['data'] = data;
                    response['success'] = true;
                    res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
                }
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating DevicesTypes.",req.headers.isencryption));

            });
    } else {

        var device_type = new DevicesTypes({
            name: String(req.body.name),
            // profile_picture: String(req.body.profile_picture),
            // device_type_id :  ObjectId(req.body.device_type_id),
            brand_name:String(req.body.brand_name),
            isactive :req.body.isactive,
            model :req.body.model,
            // hospital_id :ObjectId(req.body.hospital_id),
            // remark :String(req.body.remark)
        })

        device_type
            .save(device_type)
            .then(data => {
                var response = {};
                response['success'] = true;
                response['data'] = data;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating DevicesTypes.",req.headers.isencryption));

            });
    }
};