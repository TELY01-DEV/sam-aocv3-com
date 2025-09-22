module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        ambulance_id: ObjectId,
        profile_picture: { type: String, default: '' },
        communication_device_type_id: ObjectId,
        stream_server_id: ObjectId,
        // remark: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const CommunicationDevices = mongoose.model("communication_devices", schema);
  
    return CommunicationDevices;
  };