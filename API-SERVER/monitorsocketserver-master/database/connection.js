var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://admin:ThaiAocV21%40@117.18.126.117:27017/monitor?authSource=admin",{useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false});

var Devices = new mongoose.Schema({
    SerialNumber: {type: String, default: ''},
}, { timestamps: true });

var Patients = new mongoose.Schema({
    Name: {type: String, default: ''},
    FirstName: { type: String, default: '' },
    Gender: {type: String, enum: ['Other', 'Male', 'Female'], default: ''},
    Age: {type: Number, default: 0},
    Type: {type: String, enum: ['Unknown', 'Adult', 'Child', 'Neonate'], default: ''},
    SerialNumber: {type: String, default: ''},
    IsUpdated: {type: Number, default: 0},
}, { timestamps: true });

var AlarmInfoMaster = new mongoose.Schema({
    Id: {type: Number, default: 0},
    DeviceId: {type: String, default: ''},
    EventTime: { type: Date, default: Date.now },
    EventMessage: {type: String, default: ''},
}, { timestamps: true });

var ConnectDisconnectAuditMaster = new mongoose.Schema({
    Id: {type: Number, default: 0},
    DeviceId: {type: String, default: ''},
    ConnectTime: { type: Date, default: Date.now },
    DisconnectTime: { type: Date, default: Date.now },
    UpTime: {type: String, default: ''},
}, { timestamps: true });

var DeviceMaster = new mongoose.Schema({
    DeviceId: {type: String, default: ''},
    Name: {type: String, default: ''},
    SerialNumber: {type: String, default: ''},
    VersionSoftware: {type: String, default: ''},
    VersionHardware: {type: String, default: ''},
}, { timestamps: true });

var VitalInfoMaster = new mongoose.Schema({
    Id: {type: Number, default: 0},
    DeviceId: {type: String, default: ''},
    VitalTypeId: {type: Number, default: 0},
    VitalTime: {type: Date, default: Date.now},
    Value: {type: String, default: ''},
}, { timestamps: true });

var VitalTypeMaster = new mongoose.Schema({
    VitalTypeId: {type: String, default: ''},
    Name: {type: String, default: ''},
}, { timestamps: true });

var WaveInfoMaster = new mongoose.Schema({
    Id: {type: Number, default: 0},
    DeviceId: {type: String, default: ''},
    WaveTypeId: {type: String, default: ''},
    WaveTime: {type: Date, default: Date.now},
    WaveValue: {type: String, default: ''},
}, { timestamps: true });

var WaveTypeMaster = new mongoose.Schema({
    WaveTypeId: {type: String, default: ''},
    Name: {type: String, default: ''},
}, { timestamps: true });

module.exports = {
    AlarmInfoMaster: mongoose.model("AlarmInfoMaster", AlarmInfoMaster),
    ConnectDisconnectAuditMaster: mongoose.model("ConnectDisconnectAuditMaster", ConnectDisconnectAuditMaster),
    DeviceMaster: mongoose.model("DeviceMaster", DeviceMaster),
    VitalInfoMaster: mongoose.model("VitalInfoMaster", VitalInfoMaster),
    VitalTypeMaster: mongoose.model("VitalTypeMaster", VitalTypeMaster),
    WaveInfoMaster: mongoose.model("WaveInfoMaster", WaveInfoMaster),
    WaveTypeMaster: mongoose.model("WaveTypeMaster", WaveTypeMaster),
    Patients: mongoose.model("Patients", Patients),
    Devices: mongoose.model("Devices", Devices)
}
