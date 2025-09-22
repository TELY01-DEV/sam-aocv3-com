module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        device_type_id: ObjectId,
        remark :{ type: String, default: '' },
        hospital_id :ObjectId,
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    const AmbulanceCommunicationDevices = mongoose.model("ambulance_communication_devices", schema);
  
    return AmbulanceCommunicationDevices;
  };