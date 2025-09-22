const db = require("../database/connection.js");
const Devices = db.Devices;
const Patients = db.Patients;
const globalData = require('../global');
const data = require('../data');

exports.login = (req, res) => {
    res.render('admin/adminlogin', { title: '' });
};

exports.authCheck = (req,res,next)=> {
    if(req.session.admin) {
        next();
    } else {
        res.redirect('/admin/');
    }
},

exports.loginapi = (req,res) => { 
    var postData = req.body;
    var Token = 'sadknsdlkh65646s5a465daa';

    if(postData.Email == 'admin@gmail.com' && postData.Password == '123456'){
        req.session.admin = {};
        req.session.admin['Email'] = postData.Email;
        req.session.admin['Token'] = Token;
        req.session.save();
        return res.json(({'Status': 200, 'Success': true, 'Token': Token, 'Message': 'Login Successfully'}));
    } else {
        return res.json(({'Status': 400, 'Success': false, 'Token': '', 'Message': 'email and password are incorrect'}));
    }
}

exports.logout = (req,res,next)=> { 
    req.session.destroy();
    res.redirect('/admin/');
}

exports.dashboard= (req,res,next)=> { 
    res.render('admin/layout', { title: '', page: 'dashboard' });
}

exports.patients= (req,res,next)=> { 
    res.render('admin/layout', { title: '', page: 'patients' });
}

exports.dashboardData= (req,res,next)=> {
    Patients.find({},{'name': 1, 'email': 1, 'phone': 1}).then(patientData => {
        Devices.find({},{'name': 1, 'email': 1, 'phone': 1}).then(deviceData => {
            var result = {};
            result['TotalPatient'] = +patientData.length;
            result['TotalDevice'] = +deviceData.length;
            res.json(result);
        })
    })
}

exports.patientData = (req,res,next)=> { 
    Patients.find({}).sort( { createdAt: -1 } )
    .then(patientData => {
		var response = [];
        var rowCounter = 0;

        patientData.forEach(function(userDetail){
            var user = {};
            rowCounter++;
            user['rowCounter'] = rowCounter;
            user['Name'] = userDetail['Name'];
            user['FirstName'] = userDetail['FirstName'];
            user['Gender'] = userDetail['Gender'];
            user['Age'] = userDetail['Age'];
            user['Type'] = userDetail['Type'];
            user['Action'] = '<button type="button" data-toggle="modal" id="patient_'+ userDetail['_id'] + '" data-target="#myModal" class="btn btn-success waves-effect waves-light"  onclick="editPatient(`' + String(userDetail['_id']) + '`)">Edit</button>  ';
            if((typeof userDetail['SerialNumber'] !== 'undefined') && (userDetail['SerialNumber'] !== '')){
                user['Action'] += '<button type="button" class="btn btn-warning waves-effect waves-light"  onclick="clearDevice(`' + String(userDetail['_id']) + '`)">Clear</button>';
            }
			response.push(user);
        })

        var result = {};
    	result['recordsTotal'] = +patientData.length;
        result['recordsFiltered'] = +patientData.length;
		result['data'] = response;
        res.json(result);
    })
}

exports.freeDevice = (req,res,next)=> {
    Patients.find({ '_id': req.body.userId }).then(patientData => {
        var DevicesData = new Devices({
            SerialNumber: patientData[0].SerialNumber,
        });

        DevicesData.save(DevicesData)
        .then(DevicesData => {

            var json = {};
            json.id = patientData[0].id;
            json.FirstName = '';
            json.Name = '';
            json.Age = '';
            json.Gender = '';
            json.Type = '';
            json.SerialNumber = patientData[0].SerialNumber;

            data.EventEmitter(JSON.stringify(json));
            patientData[0].SerialNumber = '';

            Patients.findOneAndUpdate({'_id': req.body.userId}, { $set: {'SerialNumber': '', 'IsUpdated': 1} })
            .then(patientData => {

            })
            res.json(globalData.AjaxResponse(200, true,'Successfully.'));
        })
    })

}

exports.editPatient = (req,res,next)=> {  
    Patients.find({'_id': req.body.PatientId})
    .then(patientData => {
        res.json(globalData.AjaxResponse(200, true, patientData[0], 'Successfully.'));
    })
}

exports.updatePatient = (req,res,next)=> {
    var json = JSON.parse(req.body.json);
    
    var PatientsData = new Patients({
        Name: json.Name,
        FirstName: json.FirstName,
        Gender: json.Gender,
        Age: json.Age,
        Type: json.Type,
        IsUpdated: 1
    });

    if((typeof json.SerialNumber !== 'undefined') && (json.SerialNumber !== '')){
        PatientsData.SerialNumber = json.SerialNumber;

        Devices.deleteOne({'SerialNumber': json.SerialNumber})
        .then(patientData => {
        })
    }

    if(json.Id == ''){
        PatientsData.save(PatientsData)
        .then(patientData => {
            res.json(globalData.AjaxResponse(200, true,'Successfully.'));
        })
    } else {
        data.EventEmitter(JSON.stringify(json));
        var Id = json.Id;
        delete json.Id;
        Patients.findOneAndUpdate({'_id': Id}, { $set: json })
        .then(patientData => {
            res.json(globalData.AjaxResponse(200, true,'Successfully.'));
        })
    }
}

exports.deletePatients = (req,res,next)=> {  
    Devices.find({'_id': req.body.DeviceId}).then(patientData => {
        Devices.deleteOne({'_id': req.body.DeviceId})
        .then(deviceData => {
            var json = {};
                json.id = req.body.DeviceId;
                json.FirstName = '';
                json.Name = '';
                json.Age = '';
                json.Gender = '';
                json.Type = '';
                json.SerialNumber = patientData[0].SerialNumber;

                data.EventEmitter(JSON.stringify(json));
    
            res.json(globalData.AjaxResponse(200, true, patientData[0], 'Successfully.'));
        })
    })
}

exports.devices= (req,res,next)=> { 
    res.render('admin/layout', { title: '', page: 'devices' });
}

exports.freedeviceData = (req,res,next)=> { 
    Devices.find({})
    .then(deviceData => {
        var result = {};
        result['data'] = deviceData;
        res.json(result);
    })
}

exports.deviceData = (req,res,next)=> { 
    Devices.find({})
    .then(deviceData => {
		var response = [];
        var rowCounter = 0;

        deviceData.forEach(function(userDetail){
            var user = {};
            rowCounter++;
            user['rowCounter'] = rowCounter;
            user['SerialNumber'] = userDetail['SerialNumber'];
            user['Action'] = '<button type="button" id="device_'+ userDetail['_id'] + '" class="btn btn-warning waves-effect waves-light"  onclick="deleteDevice(`' + String(userDetail['_id']) + '`)">Delete</button>';
			response.push(user);
        })

        var result = {};
    	result['recordsTotal'] = +deviceData.length;
        result['recordsFiltered'] = +deviceData.length;
		result['data'] = response;
        res.json(result);
    })
}

exports.deleteDevice = (req,res,next)=> {  
    Devices.find({'_id': req.body.DeviceId}).then(patientData => {
        Devices.deleteOne({'_id': req.body.DeviceId})
        .then(deviceData => {
            var json = {};
                json.id = req.body.DeviceId;
                json.FirstName = '';
                json.Name = '';
                json.Age = '';
                json.Gender = '';
                json.Type = '';
                json.SerialNumber = patientData[0].SerialNumber;

                data.EventEmitter(JSON.stringify(json));
    
            res.json(globalData.AjaxResponse(200, true, patientData[0], 'Successfully.'));
        })
    })
}

exports.updateDevice = (req,res,next)=> {
    var json = JSON.parse(req.body.json);

    var DevicesData = new Devices({
        SerialNumber: json.SerialNumber,
    });

    DevicesData.save(DevicesData)
    .then(DevicesData => {
        res.json(globalData.AjaxResponse(200, true,'Successfully.'));
    })
}