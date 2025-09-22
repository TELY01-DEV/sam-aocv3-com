const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const CommunicationDeviceTypes = db.communication_device_types;
const CommunicationDevices = db.communication_devices;
const IpServerCommunications = db.stream_servers;
// const AmbulanceCommunicationDevices = db.ambulance_communication_devices;
const Ambulances =db.ambulances;

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.getCommunicationDeviceTypeList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getCommunicationDeviceTypeListCondition = [
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
    
    CommunicationDeviceTypes.aggregate(getCommunicationDeviceTypeListCondition)
    .then(count => {
        getCommunicationDeviceTypeListCondition.splice(-1,1);
        // getCommunicationDeviceTypeListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getCommunicationDeviceTypeListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getCommunicationDeviceTypeListCondition.push({ "$limit": Number(pageSize) });
        CommunicationDeviceTypes.aggregate(getCommunicationDeviceTypeListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(true, 500, {}, err.message ||  "Some error occurred while retrieving CommunicationDeviceTypes.",req.headers.isencryption));
    });
};

exports.getCommunicationDeviceList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getCommunicationDeviceListCondition = [
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
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'ambulance_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'stream_servers',
                'localField': 'stream_server_id',
                'foreignField': '_id',
                'as': 'stream_serverDetail'
            }
        },
        {
            '$unwind': {
                "path": "$stream_serverDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'communication_device_types',
                'localField': 'communication_device_type_id',
                'foreignField': '_id',
                'as': 'communication_device_typesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$communication_device_typesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals', 
                'localField': 'ambulancesDetail.hospital_id', 
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
        { '$count': "count" }
    ]
    
    CommunicationDevices.aggregate(getCommunicationDeviceListCondition)
    .then(count => {
        getCommunicationDeviceListCondition.splice(-1,1);
        if(pageSize < 999){
        getCommunicationDeviceListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getCommunicationDeviceListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getCommunicationDeviceListCondition.push({ "$limit": Number(pageSize) });
        }
        getCommunicationDeviceListCondition.push(
        {
            '$project' : {
                '_id': 1,
                'name' :1,
                'isactive':1,
                'ambulance_id':1,
                'stream_server_id':1,
                'communication_device_type_id':1,
                'profile_picture' :1,
                'profileUrl':"/uploads/communication_devices/icon_images/",
                'stream_serverDetail':{
                    '_id' :1,
                    'name':1
                },
                'ambulancesDetail':{
                    '_id' : {$ifNull: ['$ambulancesDetail._id','']},
                    'name1':{$ifNull: ['$ambulancesDetail.name1','']}
                },
                'communication_device_typesDetail' :{
                    '_id' :1,
                    'name':1
                },
                "zone_id" :{$ifNull: ["$zoneDetail._id",'']},
                'hospital_id' : {$ifNull: ["$hospitalDetails._id",'']}
            }
        })
        CommunicationDevices.aggregate(getCommunicationDeviceListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(true, 500, {}, err.message ||  "Some error occurred while retrieving CommunicationDeviceTypes.",req.headers.isencryption));
    });
};

exports.getStreamServersList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getStreamServersListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                    {
                        '$or': [
                            { name: { $regex: String(req.body.searchValue), $options: 'i' } }
                           
                        ]
                    }
                ]
            }
        },
        { '$count': "count" }
    ]
    
    IpServerCommunications.aggregate(getStreamServersListCondition)
    .then(count => {
        getStreamServersListCondition.splice(-1,1);
      if(pageSize < 999){
        getStreamServersListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getStreamServersListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getStreamServersListCondition.push({ "$limit": Number(pageSize) });
    }
        IpServerCommunications.aggregate(getStreamServersListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(true, 500, {}, err.message ||  "Some error occurred while retrieving IpServerCommunications.",req.headers.isencryption));
    });
};



// exports.getAmbulanceCommunicationDeviceList = (req, res) => {
//     console.log("getAmbulanceCommunicationDeviceList",req.body);
//     var currentPage = Number(req.body.currentPage);
//     var pageSize = Number(req.body.pageSize);
    
//     var getAmbulanceCommunicationDeviceListCondition = [
//         {
//             '$match': {
//                 "$and": [
//                     { "isdeleted": false },
//                     // {ambulance_id : {
//                     //     "$exists": true, 
//                     //     "$ne": null 
//                     // }},
//                     {
//                         '$or': [
//                             { name: { $regex: String(req.body.searchValue), $options: 'i' } },
//                         ]
//                     }
//                 ]
//             }
//         },
//         { '$count': "count" }
//     ]
    
//     CommunicationDeviceTypes.aggregate(getAmbulanceCommunicationDeviceListCondition)
//     .then(count => {
//         getAmbulanceCommunicationDeviceListCondition.splice(-1,1);
//         // getAmbulanceCommunicationDeviceListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
//         getAmbulanceCommunicationDeviceListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
//         getAmbulanceCommunicationDeviceListCondition.push({ "$limit": Number(pageSize) });
//         CommunicationDeviceTypes.aggregate(getAmbulanceCommunicationDeviceListCondition)
//         .then(data => {
//             var response = {};
//             response['count'] = (count[0])?count[0].count:0;
//             response['data'] = data;
//             res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
//         })
//     })
//     .catch(err => {
//         res.status(500).send({
//             message:
//             err.message || "Some error occurred while retrieving CommunicationDeviceTypes."
//         });
//     });
// };

exports.getAmbulanceCommunicationDeviceList = (req, res) => {
    var currentPage = Number(req.body.currentPage);
    var pageSize = Number(req.body.pageSize);
    
    var getCommunicationDeviceListCondition = [
        {
            '$match': {
                "$and": [
                    { "isdeleted": false },
                     {ambulance_id : {
                        "$exists": true, 
                        "$ne": null 
                    }},
                    {
                        '$or': [
                            { name: { $regex: String(req.body.searchValue), $options: 'i' } },
                        ]
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'ambulances',
                'localField': 'ambulance_id',
                'foreignField': '_id',
                'as': 'ambulancesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$ambulancesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'stream_servers',
                'localField': 'stream_server_id',
                'foreignField': '_id',
                'as': 'stream_serverDetail'
            }
        },
        {
            '$unwind': {
                "path": "$stream_serverDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'communication_device_types',
                'localField': 'communication_device_type_id',
                'foreignField': '_id',
                'as': 'communication_device_typesDetail'
            }
        },
        {
            '$unwind': {
                "path": "$communication_device_typesDetail",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                'from': 'hospitals', 
                'localField': 'ambulancesDetail.hospital_id', 
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
        { '$count': "count" }
    ]
    
    CommunicationDevices.aggregate(getCommunicationDeviceListCondition)
    .then(count => {
        getCommunicationDeviceListCondition.splice(-1,1);
        if(pageSize < 999){
        getCommunicationDeviceListCondition.push({ "$sort": JSON.parse(req.body.sortValue) });
        getCommunicationDeviceListCondition.push({ "$skip": Number((currentPage-1)*pageSize) });
        getCommunicationDeviceListCondition.push({ "$limit": Number(pageSize) });
        }
        getCommunicationDeviceListCondition.push(
        {
            '$project' : {
                '_id': 1,
                'name' :1,
                'isactive':1,
                'ambulance_id':1,
                'stream_server_id':1,
                'communication_device_type_id':1,
                'profile_picture' :1,
                'profileUrl':"/uploads/communication_devices/icon_images/",
                'stream_serverDetail':{
                    '_id' :1,
                    'name':1
                },
                'ambulancesDetail':{
                    '_id' : {$ifNull: ['$ambulancesDetail._id','']},
                    'name1':{$ifNull: ['$ambulancesDetail.name1','']}
                },
                'communication_device_typesDetail' :{
                    '_id' :1,
                    'name':1
                },
                "zone_id" :{$ifNull: ["$zoneDetail._id",'']},
                'hospital_id' : {$ifNull: ["$hospitalDetails._id",'']}
            }
        })
        CommunicationDevices.aggregate(getCommunicationDeviceListCondition)
        .then(data => {
            var response = {};
            response['count'] = (count[0])?count[0].count:0;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message ||  "Some error occurred while retrieving CommunicationDevices.",req.headers.isencryption));
    });
};

exports.updateCommunicationDevices = (req, res) => {
    var response = {};
    if(req.body._id !== 'null' && req.body._id !== null){
        var communicationdevices = {
            name: String(req.body.name),
            ambulance_id: "",
            communication_device_type_id: ObjectId(req.body.communication_device_type_id),
            stream_server_id: ObjectId(req.body.stream_server_id),
            isactive:req.body.isactive,
        }
     
        CommunicationDevices.findOneAndUpdate({_id: req.body._id}, { $set: communicationdevices })
        .then(async data => {
            if(req.files && req.files.length>0) {
                    ProfileImageURL = await configure.fsUpload(data._id , 'communicationdevicesImage',  req.files[0]);
                    communicationdevices.userProfile = ProfileImageURL;
                    CommunicationDevices.findOneAndUpdate({_id :req.body._id},{$set :{profile_picture :ProfileImageURL}}).then((data,err) => {
                        console.log(err);
                    })
            }
            if (!data) {
                res.status(204).send(configure.apiResp(false, 204, {}, "Communication Devices data not found !.",req.headers.isencryption));
            } else {
                response['data'] = data;
                response['success'] = true;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            }
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message ||  "Some error occurred while updating the Communication Devices.",req.headers.isencryption));
        });
    }else{
        var communicationdevices = new CommunicationDevices({
            name: String(req.body.name),
            ambulance_id: ObjectId(req.body.ambulance_id),
            communication_device_type_id: ObjectId(req.body.communication_device_type_id),
            stream_server_id: ObjectId(req.body.stream_server_id), 
            isactive: (req.body.isactive)?1:1,
        })
        
        communicationdevices
        .save(communicationdevices)
        .then(async data => {
            if(req.files && req.files.length >0){
           let ProfileImageURL = await configure.fsUpload(data._id, 'communicationdevicesImage',  req.files[0]);
            communicationdevices.userProfile = ProfileImageURL;
            CommunicationDevices.findOneAndUpdate({_id :data._id},{$set :{profile_picture :ProfileImageURL}}).then((data,err) => {
                console.log(err);
            })         
        }
              var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(true, 500, {}, err.message || "Some error occurred while creating the Sub-District.",req.headers.isencryption));
        });
    }
}

exports.updateCommunicationDeviceType = (req, res) => {
    var response = {};
    if(req.body._id !== 'null' && req.body._id !== null){
        var communicationdevicestype = {
            name: String(req.body.name),
            brand_name: String(req.body.brand_name),
            model: String(req.body.model),
            remark: String(req.body.remark),
            isactive:Boolean(req.body.isactive),
        }
     
        CommunicationDeviceTypes.findOneAndUpdate({_id: req.body._id}, { $set: communicationdevicestype })
        .then(async data => {
            if (!data) {
                res.status(204).send(configure.apiResp(false, 204, {}, "Communication Devices Type data not found !.",req.headers.isencryption));

            } else {
                response['data'] = data;
                response['success'] = true;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            }
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating the Communication Devices Type.",req.headers.isencryption));
          
        });
    }else{
        var communicationdevicestype = new CommunicationDeviceTypes({
            name: String(req.body.name),
            brand_name: String(req.body.brand_name),
            model: String(req.body.model),
            remark: String(req.body.remark),
            isactive: (req.body.isactive)?1:1,
        })
        
        communicationdevicestype
        .save(communicationdevicestype)
        .then(async data => {
            var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating the CommunicationDeviceTypes.",req.headers.isencryption));
        });
    }
}

exports.updateStreamServers = (req, res) => {
    var response = {};
    if(req.body._id !== 'null' && req.body._id !== null){
        var streamservers = {
            name: String(req.body.name),
            ip_address: String(req.body.ip_address),
            domain_name: String(req.body.domain_name),
            isactive:Boolean(req.body.isactive),
        }
     
        IpServerCommunications.findOneAndUpdate({_id: req.body._id}, { $set: streamservers })
        .then(async data => {
            if (!data) {
                res.status(204).send(configure.apiResp(false, 204, {}, "StreamServers Type data not found !.",req.headers.isencryption));
            } else {
                response['data'] = data;
                response['success'] = true;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            }
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message ||"Some error occurred while updating the StreamServers.",req.headers.isencryption));
          
        });
    }else{
        var streamservers = new IpServerCommunications({
            name: String(req.body.name),
            ip_address: String(req.body.ip_address),
            domain_name: String(req.body.domain_name),
            isactive: (req.body.isactive)?1:1,
        })
        
        streamservers
        .save(streamservers)
        .then(async data => {
            var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message ||"Some error occurred while creating the Sub-District.",req.headers.isencryption));
        });
    }
}

exports.updateAmbulanceCommunicationDevice = (req, res) => {
    var response = {};
    if(req.body._id !== 'null'){
        var ambulance_communication_devices = {
            name: String(req.body.name),
            ambulance_id: ObjectId(req.body.ambulance_id),
            communication_device_type_id: ObjectId(req.body.communication_device_type_id),
            hospital_id: ObjectId(req.body.hospital_id),
            remark: String(req.body.remark),
            isactive:1,
        }
     
        CommunicationDevices.findOneAndUpdate({_id: req.body._id}, { $set: ambulance_communication_devices })
        .then(async data => {
            if (!data) {
                res.status(204).send(configure.apiResp(false, 204, {},  "CommunicationDevices Type data not found !.",req.headers.isencryption));
            } else {
                response['data'] = data;
                response['success'] = true;
                res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
            }
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while updating the CommunicationDevices.",req.headers.isencryption));
        });
    }else{
        var ambulance_communication_devices = new CommunicationDevices({
            name: String(req.body.name),
            ambulance_id: ObjectId(req.body.ambulance_id),
            communication_device_type_id: ObjectId(req.body.communication_device_type_id),
            hospital_id: ObjectId(req.body.hospital_id),
            remark: String(req.body.remark),
            isactive: (req.body.isactive)?1:1,
        })
        
        ambulance_communication_devices
        .save(ambulance_communication_devices)
        .then(async data => {
            var response = {};
            response['success'] = true;
            response['data'] = data;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        })
        .catch(err => {
            res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while creating the Sub-District.",req.headers.isencryption));
        });
    }
}


exports.getAmbulanceFromHospital = (req,res)=>{
    const ambulanceCondition = [
        {'$match' :{
            'hospital_id' : ObjectId(req.body.hospital_id)
        }},
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
        {'$project' :{
            '_id' :1,
            'name1':1,
            "hospitalDetails":
            {
                '_id':1,
                'name1':1,
                'logo_image':1,
                'logo_path' :  configure.fsUploadURL('hospitalLogo'),
            }
        }}
    ]   
    Ambulances.aggregate(ambulanceCondition).then(data=>{
        let response = {};
        response['data']= data
        res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
    })
}

