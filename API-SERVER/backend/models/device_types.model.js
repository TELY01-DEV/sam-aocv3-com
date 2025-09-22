module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        brand_name : { type: String, default: '' },
        model: { type: String, default: '' },
        isdeleted : {type: Boolean, default: false},
        isactive : {type: Number, default: 1},
      },
      { timestamps: true }
    );

    const DevicesTypes = mongoose.model("device_types", schema);
    return DevicesTypes;
  };