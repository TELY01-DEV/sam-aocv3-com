module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        ambulance_id: ObjectId,
        location: {
          lat: { type: Number, default: 0 },
          lon: { type: Number, default: 0 },
        },
        source_location: {
          lat: { type: Number, default: 0 },
          lon: { type: Number, default: 0 },
        },
        destination_location: {
          lat: { type: Number, default: 0 },
          lon: { type: Number, default: 0 },
        },
        speed_above_80: ObjectId,
        speed_above_120: ObjectId,
        speed: { type: Number, default: 0.00 },
        avg_speed: { type: Number, default: 0.00 },
        heading: { type: Number, default: 0 },
        count_datetime: { type: Date, default: Date.now },
        state: { type: String, enum : ['GREEN', 'YELLOW', 'RED'], default: 'GREEN' },
        covered_distance: { type: Number, default: 0.00 },
        estimated_time: { type: Number, default: 0.00 },
      },
      { timestamps: true }
    );

    const AmbulanceTrackings = mongoose.model("ambulance_trackings", schema);

    return AmbulanceTrackings;
  };