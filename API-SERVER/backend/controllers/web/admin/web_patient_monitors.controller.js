const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const PatientMonitors = db.patient_monitors;

exports.getPatientMonitorsList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getPatientMonitorsListCondition = [
        {
            '$match': {
                "isdeleted": { $eq: false },
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
            '$match': {
                "$or": [
                    { 'name': { $regex: String(req.body.searchValue), $options: 'i' } },
                    { 'serial_number': { $regex: String(req.body.searchValue), $options: 'i' } },
                    { 'hospitalDetails.full_name': { $regex: String(req.body.searchValue), $options: 'i' } },
                ]
            }
        },
        {
            $lookup: {
                from: "aoc_requests",
                let: {
                    moniter_id: "$_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$moniter_id",
                                            "$$moniter_id"
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
           { '$project': {
                "_id": 1,
                "name": 1,
                "mac_address": 1,
                "ambulance_box_code" : {$ifNull : [String("$ambulanceDetail.ambulance_box_code") ,'']},
                "web_address": 1,
                "isactive": 1,
                "hospital_id": 1,
                "is_online": 1 ,
                "serial_number" :1,
                "type":1,
                "web_port":1,
                "web_view":1,
                "web_view_url":1,
                "zone_id" : "$hospitalDetails.zone_id",
                "hospital_name" :"$hospitalDetails.full_name"
             
            }},
        { '$count': "count" }
    ]
    
    PatientMonitors.aggregate(getPatientMonitorsListCondition)
    .then(count => {
        getPatientMonitorsListCondition.splice(-1,1);
        getPatientMonitorsListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getPatientMonitorsListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getPatientMonitorsListCondition.push({ "$limit": Number(pageSize) });
        PatientMonitors.aggregate(getPatientMonitorsListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            response['MONITER_STREAMING_SERVER_URL'] = 'rtmp://'+String(process.env.MONITER_STREAMING_SERVER_IP) + ':1935/live/temp_';
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retriving Patientmonitor.",req.headers.isencryption));

    });
};

exports.updatePatientMonitor =(req,res)=>{
    var response = {};
    if(req.body._id !== 'null' && req.body._id !== null){
        var patient_moniter = {
            serial_number : String(req.body.serial_number),
            web_address : String(req.body.web_address),
            web_port : String(req.body.web_port),
            type : String(req.body.type),
            name : String(req.body.name),
            isactive : Number(req.body.isactive),
            hospital_id: ObjectId(req.body.hospital_id),
            web_view : req.body.web_view
        }

        if(String(req.body.type) !== 'JENNY' && Number(req.body.web_view) == 1) { 
            patient_moniter['web_view_url'] = String(req.body.web_view_url);
        } else if (String(req.body.type) == 'JENNY'){
            patient_moniter['web_view'] = 1;
            patient_moniter['is_online'] = 1;
        }
     
        PatientMonitors.findOneAndUpdate({_id: req.body._id}, { $set: patient_moniter })
        .then(async data => {
            response['data'] = data;
            response['success'] = true;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating Patientmonitor.",req.headers.isencryption));

        });
    }else{
        let patient_moniter_detail = {
            serial_number : String(req.body.serial_number),
            web_address : String(req.body.web_address),
            web_port : String(req.body.web_port),
            type : String(req.body.type),
            name : String(req.body.name),
            isactive : Number(req.body.isactive),
            hospital_id: ObjectId(req.body.hospital_id),
            web_view_url : String(req.body.web_view_url),
            web_view : req.body.web_view
        }

        if(String(req.body.type) == 'JENNY') { 
            patient_moniter_detail['web_view_url'] =  String(process.env.MONITER_STREAMING_SERVER_URL) +  String(req.body.serial_number);
            patient_moniter_detail['web_view'] = 1;
            patient_moniter_detail['is_online'] = 1;
        }

        var patient_moniter = new PatientMonitors(patient_moniter_detail);
        
        patient_moniter
        .save(patient_moniter)
        .then(async data => {
            var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating Patientmonitor.",req.headers.isencryption));

        });
    }
}