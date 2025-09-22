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
    
    schema.index({ ambulance_id: 1 });
    const AmbulanceImages = mongoose.model("ambulance_images", schema);
  
    return AmbulanceImages;
  };