module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {
        ambulance_id: { type: ObjectId, index: true },
        images: Mixed
      },
      { timestamps: true }
    );

    schema.index({ ambulance_id: 1 });
    const AmbulanceImageHistories = mongoose.model("ambulance_image_histories", schema);
  
    return AmbulanceImageHistories;
  };