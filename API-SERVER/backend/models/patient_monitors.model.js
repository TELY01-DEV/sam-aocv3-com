module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        hospital_id: ObjectId,
        serial_number: { type: String, default: '' },
        is_online: { type: Number, default: 0 },
        web_address: { type: String, default: '' },
        web_port: { type: String, default: '' },
        software_version: { type: String, default: '' },
        hardware_version: { type: String, default: '' },
        app_version: { type: String, default: '' },
        type: { type: String, enum : ['BLT', 'DGT7', 'JENNY'], default: 'BLT' },
        name: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        web_view_url :{ type: String, default: '' },
        web_view : {type: Number, default: 0},
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    schema.index({ hospital_id: 1, isactive: 1, isdeleted: 1 });
    const PatientMonitors = mongoose.model("patient_monitors", schema);
    return PatientMonitors;
  };