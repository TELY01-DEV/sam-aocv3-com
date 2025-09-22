module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {
        ambulance_id: ObjectId,
        aoc_request_id: ObjectId,
        locations: Mixed,
        speed_above_80: ObjectId,
        speed_above_120: ObjectId,
        speed: { type: Number, default: 0.00 },
        createdAt : { type: Date, default: Date.now },
      },
    );

    schema.index({ ambulance_id: 1, aoc_request_id: 1, speed_above_80: 1, speed_above_120: 1 });
    const AmbulanceTrackingHistories = mongoose.model("ambulance_tracking_histories", schema);
  
    return AmbulanceTrackingHistories;

  };