const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const AocRequests = db.aoc_requests;

exports.postAliveRequestDetail = (req, res) => {
    const aocRrequestDetail = [];

    aocRrequestDetail.push({
        '$match': { _id: { $eq: ObjectId(req.body.aoc_request_id) } }
    },
        {
            '$lookup': {
                'from': 'patient_requests',
                'localField': 'patient_request_id',
                'foreignField': '_id',
                'as': 'patientRequestsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$patientRequestsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'patients',
                'localField': 'patientRequestsDetail.patient_id',
                'foreignField': '_id',
                'as': 'patientRequestsDetail.patientsDetail'
            }
        },
        {
            '$unwind': {
                "path": "$patientRequestsDetail.patientsDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$project': {
                '_id': 1,
                'updatedAt': 1,
                'destination': {
                    'address': 1,
                    'location': 1
                },
                'patientRequestsDetail': {
                    '_id': 1,
                    'sickness_type': 1,
                    'zone_id': 1,
                    'location_image': { $ifNull: ['$patientRequestsDetail.location_image', ''] },
                    'location_image_url': "/uploads/patient_requests/location_images/",
                    'patientsDetail': {
                        '_id': 1,
                        'first_name': 1,
                        'last_name': 1,
                        'profile_image': { $ifNull: ['$patientRequestsDetail.patientsDetail.profile_image', ''] },
                        'profile_image_url': "/public/uploads/patient_profile",
                        'phone': { $ifNull: ['$patientRequestsDetail.patientsDetail.phone', ''] }
                    }
                }
            }
        })
    AocRequests.aggregate(aocRrequestDetail).then(data => {
        var resp = data[0]
        new Promise((resolve, reject) => {
            request({
                uri: "https://maps.googleapis.com/maps/api/staticmap?center=" + String(resp.destination.location.lat) + "," + String(resp.destination.location.lon) + "&zoom=16&size=800x450&maptype=roadmap&markers=color:red%7C" + String(resp.destination.location.lat) + ",%20" + String(resp.destination.location.lon) + "&key=" + String("AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls"),
            })
                .pipe(fs.createWriteStream(configure.fsUploadURL("patientRequestLocationImage") + `location_${resp.patientRequestsDetail._id}.png`))
                .on('finish', (data) => {
                    let patient_location = { 'location_image': `location_${resp.patientRequestsDetail._id}.png` }
                    PatientRequests.findOneAndUpdate({ _id: ObjectId(resp.patientRequestsDetail._id) }, { $set: patient_location }).then().catch(err => console.log(err))
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                });
        })
            .catch((error) => {
                console.log(`Something happened: ${error}`);
            });

        res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
    })

}
