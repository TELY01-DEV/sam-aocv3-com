module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        device_code: { type: String, default: '' },
        mac_address :{ type: String, default: '' },
        ambulance_id :ObjectId,
        // isactive: { type: Number, default: 1 },
        // isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );
    
    schema.index({ device_code: 1, ambulance_id: 1, createdAt: 1, updatedAt: 1 });
    const TrackApps = mongoose.model("track_apps", schema);
  
    return TrackApps;
  };