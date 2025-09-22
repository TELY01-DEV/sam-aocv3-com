module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        brand_name: { type: String, default: '' },
        model: { type: String, default: '' },
        remark: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const CommunicationDeviceTypes = mongoose.model("communication_device_types", schema);
  
    return CommunicationDeviceTypes;
  };