const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const PatientSituations = db.patient_situations;

exports.getPatientSituationsList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getPatientSituationsListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    {
                        '$or': [
                            { situation: { $regex: String(req.body.searchValue), $options: 'i' } },
                            { situation1: { $regex: String(req.body.searchValue), $options: 'i' } },
                        ]
                    }
                ]
            }
        },
        { '$count': "count" }
    ]
    
    PatientSituations.aggregate(getPatientSituationsListCondition)
    .then(count => {
        getPatientSituationsListCondition.splice(-1,1);
        getPatientSituationsListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getPatientSituationsListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getPatientSituationsListCondition.push({ "$limit": Number(pageSize) });
        PatientSituations.aggregate(getPatientSituationsListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retriving PatientSituations.",req.headers.isencryption));
    });
};

exports.updatePatientSitutation = (req, res) => {
    var response = {};
    if (req.body._id !== 'null' && req.body._id !== null) {
        var patient_situation = {
            situation: String(req.body.situation),
            situation1: String(req.body.situation1),
            isactive :1
        }

        PatientSituations.findOneAndUpdate({ _id: req.body._id }, { $set: patient_situation })
            .then(async data => {
                if (!data) {
                    res.status(404).send(configure.apiResp(false, 404, {},"Users data not found !.",req.headers.isencryption));

                } else {
                    response['data'] = data;
                    response['success'] = true;
                    res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
                }
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating PatientSituations.",req.headers.isencryption));
            });
    } else {

        var patient_situation = new PatientSituations({
            situation: String(req.body.situation),
            situation1: String(req.body.situation1),
            // isactive: (req.body.isactive) ? 1 : 0,
        })

        patient_situation
            .save(patient_situation)
            .then(data => {
                var response = {};
                response['success'] = true;
                response['data'] = data;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            })
            .catch(err => {
                res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating PatientSituations.",req.headers.isencryption));
            });
    }
};