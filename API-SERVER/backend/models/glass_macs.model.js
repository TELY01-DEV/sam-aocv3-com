module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;

  var schema = mongoose.Schema(
    {
      name: { type: String, default: '' },
      mac_address: { type: String, default: '' },
      hospital_id: ObjectId,
      is_online: { type: Number, default: 0 },
      description: { type: String, default: '' },
      ambulance_id : ObjectId,
      isactive: { type: Number, default: 1 },
      isdeleted : {type: Boolean, default: false},
      type: { type: String, default: '' },
      token: { type: String, default: '' },
      app_version: { type: String, default: '' },
      brand_name: { type: String, default: '' },
      model: { type: String, default: '' },
      manufacturer: { type: String, default: '' },
      location: {
        lat: { type: Number, default: 0 },
        lon: { type: Number, default: 0 },
      },
    },
    { timestamps: true }
  );

  schema.index({ hospital_id: 1, isactive: 1, isdeleted: 1, ambulance_id: 1 });
  const GlassMacs = mongoose.model("glass_macs", schema);

  return GlassMacs;
};