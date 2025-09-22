const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const https = require('https');

const mongoose = require("mongoose");
const { response } = require("express");
const ObjectId = mongoose.Types.ObjectId;
const AocUsers = db.aoc_users;
// const AocRequests = db.aoc_requests;
const PatientMonitors = db.patient_monitors;

exports.postUserMonitorList = (req, res) => {
    var current_page = Number(req.body.current_page);
    var page_size = Number(req.body.page_size);

    var moniterCondition = [];

    moniterCondition.push(
        {
            '$match': {
                '_id': ObjectId(req.body.user_id)
            }
        },
        {
            '$unwind': "$hospital_ids",
        },
        {
            '$lookup': {
                'from': 'patient_monitors',
                'localField': 'hospital_ids',
                'foreignField': 'hospital_id',
                'as': 'patientMonitorsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$patientMonitorsDetail",
                "preserveNullAndEmptyArrays": false
            }
        },
        {
            '$group': {
                '_id': '$patientMonitorsDetail._id',
                'name': { $first: '$patientMonitorsDetail.name' },
                'is_online': { $first: '$patientMonitorsDetail.is_online' },
                'type': { $first: '$patientMonitorsDetail.type' },
                'web_address': { $first: '$patientMonitorsDetail.web_address' },
                'web_port': { $first: '$patientMonitorsDetail.web_port' },
                'serial_number': { $first: '$patientMonitorsDetail.serial_number' },
                'web_view': { $first: '$patientMonitorsDetail.web_view' },
                'web_view_url': { $first: '$patientMonitorsDetail.web_view_url' },
            }
        })

    if (req.body.search_value && req.body.sort_value !== undefined && req.body.sort_value !== 'undefined') {
        moniterCondition.push({
            '$match': {
                "$or": [
                    { "name": { $regex: String(req.body.search_value), $options: 'i' } },
                    { "serial_number": { $regex: String(req.body.search_value), $options: 'i' } },
                ]
            }
        },
        )
    }

    if (req.body.sort_value && req.body.sort_value !== undefined && req.body.sort_value !== 'undefined') {
        moniterCondition.push(
            { "$sort": JSON.parse(req.body.sort_value) },
        )
    }

    moniterCondition.push({ '$count': "count" });
    // moniterCondition.push({ "$skip": Number((current_page - 1) * page_size) });
    // moniterCondition.push({ "$limit": Number(page_size) });

    AocUsers.aggregate(moniterCondition)
        .then(count => {
            moniterCondition.splice(-1, 1);
            moniterCondition.push({ "$sort": JSON.parse(req.body.sort_value) });
            moniterCondition.push({ "$skip": Number((current_page - 1) * page_size) });
            moniterCondition.push({ "$limit": Number(page_size) });

            AocUsers.aggregate(moniterCondition)
                .then(data => {
                    var response = {};
                    response['count'] = (count[0]) ? count[0].count : 0;
                    response['data'] = data;
                    // res.status(200).send(response);
                    res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));

                })
        })
}

exports.postUserMonitorReportDetail = (req, res) => {
    let postData = {}
    postData['SerialNumber'] = req.body['serial_number'];
    postData['StartDatetime'] = req.body['start_date'];
    postData['EndDatetime'] = req.body['end_date'];
    postData = JSON.stringify(postData)
    const options = {
        hostname: 'ecgsocket.aocv2.com',
        port: 443,
        path: "/report/deviceHistoryDetail",
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        },
    };

    var https_req = https.request(options, (https_res) => {
        var body = '';

        https_res.on('data', function (chunk) {
            body += chunk;
        });

        https_res.on('end', function () {
            var response = JSON.parse(body);
            if(response['Success']){
                var response_data = JSON.stringify(response['Data']);
                res.send(configure.apiResp(true, 200, response_data, '', req.headers.isencryption));
            }
        });
    });
    https_req.write(postData);
    https_req.end();
}