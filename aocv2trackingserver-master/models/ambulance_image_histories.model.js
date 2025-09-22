module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {
        ambulance_id: ObjectId,
        images: Mixed
      },
      { timestamps: true }
    );

    const AmbulanceImageHistories = mongoose.model("ambulance_image_histories", schema);
  
    return AmbulanceImageHistories;
  };