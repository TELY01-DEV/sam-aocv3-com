const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const Doctors = db.doctors;
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
exports.getDoctorsList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getDoctorsListCondition = [
        {
            '$match': {
                "$and": [
                    { "isactive": 1 },
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
           { '$project': {
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
                "is_online": 1 ,
                "isactive": 1 ,
                "isdeleted" :1,
                "zone_id" : "$hospitalDetails.zone_id"
             
            }},
        { '$count': "count" },

        
    ]
    
    Doctors.aggregate(getDoctorsListCondition)
    .then(count => {
        getDoctorsListCondition.splice(-1,1);
        getDoctorsListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getDoctorsListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getDoctorsListCondition.push({ "$limit": Number(pageSize) });
        Doctors.aggregate(getDoctorsListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving Doctors.",req.headers.isencryption));
    });
};


exports.updateDoctorDetail = (req, res) => {
    var response = {};
    if(req.body._id !== 'null'){
        var doctor = {
            first_name: String(req.body.first_name),
            last_name: String(req.body.last_name),
            doctor_type: String(req.body.doctor_type),
            birthdate : new Date(req.body.birthdate),
            hospital_id: ObjectId(req.body.hospital_id),
            email: String(req.body.email),
            password :String(req.body.password),
            email: String(req.body.email),
            gender :req.body.gender,
            // about :req.body.about,
            // remark :req.body.remark,
            // shift :req.body.shift,
            isactive:1,
        }
     
        Doctors.findOneAndUpdate({_id: req.body._id}, { $set: doctor })
        .then(data => {
            if (req.files && req.files.length) {
                configure.random(4, 'Number').then(async (ran) =>{
                    var ProfileImage = String(Date.now() + ran);
                    ProfileImageURL = await configure.fsUpload(ProfileImage, 'userProfile',  req.files[0]);
                    doctor.userProfile = ProfileImageURL;
                    Doctors.findOneAndUpdate({_id :req.body._id},{$set :{userProfile :ProfileImageURL}}).then((data,err) => {
                        console.log(err);
                    })
                })
                // let user_image =  configure.fsUpload(data._id, 'userProfile',);
            }
            if (!data) {
                res.status(404).send(configure.apiResp(false, 404, {},"Doctors data not found !.",req.headers.isencryption));
            } else {
                response['data'] = data;
                response['success'] = true;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            }
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating Doctors.",req.headers.isencryption));
        });
    }else{

        var doctor = new Doctors({
            first_name: String(req.body.first_name),
            last_name: String(req.body.last_name),
            phone: String(req.body.phone),
            zone_id: ObjectId(req.body.zone_id),
            hospital_id: ObjectId(req.body.hospital_id),
            isactive: String(req.body.isactive),
            is_scan :String(req.body.is_scan),
            email: String(req.body.email),
            birthdate : Date(req.body.birthdate),
            isactive: (req.body.isactive)?1:1,
        })
        
        doctor
        .save(doctor)
        .then(data => {
            if (req.files && req.files.length) configure.fsUpload(data._id, 'doctorProfile', req.files[0]);
            var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating Doctors.",req.headers.isencryption));
        });
    }
};