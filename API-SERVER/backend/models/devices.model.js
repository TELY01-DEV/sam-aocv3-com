module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        device_type_id: ObjectId,
        brand_name : { type: String, default: '' },
        profile_picture: { type: String, default: '' },
        remark :{ type: String, default: '' },
        hospital_id :ObjectId,
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    const Devices = mongoose.model("devices", schema);
    return Devices;
  };