let db_schema = require('./connection.js');

exports.insert = function (dataStr) {
    var data = JSON.parse(dataStr);

    db_schema.Devices.find({SerialNumber: data.SerialNumber},{ _id: 1})
    .then(data => {
        if(data._id){
            data.DeviceId = data.id;
            save(data);
        } else {
            var device = new db_schema.Devices({SerialNumber: data.SerialNumber})
            .save()
            .then((data) => {
                data.DeviceId = data.id;
                save(data);
            })
        }
        res.send(configure.apiResp(true, 200, data, ''));
    })
}

function save(data) {
    // 1= Vital, 2= Alarm, 3= Waves
    switch (data.SyncId) {
        case 1:
            new db_schema.VitalInfoMaster({
                Id: data.Id,
                DeviceId: data.DeviceId,
                VitalTypeId: data.VitalTypeId,
                VitalTime: data.VitalTime,
                Value: data.Value,
            }).save();
            break;

        case 2:
            new db_schema.AlarmInfoMaster({
                Id: data.Id,
                DeviceId: data.DeviceId,
                EventTime: data.EventTime,
                EventMessage: data.EventMessage,
            }).save();
            break;

        case 3:
            new db_schema.WaveInfoMaster({
                Id: data.Id,
                DeviceId: data.DeviceId,
                WaveTypeId: data.WaveTypeId,
                WaveTime: data.WaveTime,
                WaveValue: data.WaveValue,
            }).save();
            break;
    
        default:
            break;
    }
}