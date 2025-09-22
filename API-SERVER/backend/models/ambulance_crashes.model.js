module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;

  var schema = mongoose.Schema(
    {
      ambulance_id: ObjectId,
      location: {
        lat: { type: Number, default: 0 },
        lon: { type: Number, default: 0 },
      },
      speed: { type: Number, default: 0.00 },
      heading: { type: String, default: '' },
      ambulance_image_histories_id: ObjectId,
      location_detail: {
        address: { type: String, default: '' },
        image: { type: String, default: '' }
      },
      app_notification:  { type: Number, default: 0 }
    },
    { timestamps: true }
  );

  schema.index({ ambulance_id: 1 });
  const AmbulanceCrashes = mongoose.model("ambulance_crashes", schema);
  return AmbulanceCrashes;
};