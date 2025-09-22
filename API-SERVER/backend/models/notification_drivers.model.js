module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        user_id: ObjectId,
        brand: { type: String, default: '' },
        notification_type:{ type: String, 
        enum : ['ACNS',
        //  'ONLINE_AMBULANCE',
         'AMBULANCE_STATUS_CHANGE',
         'OPERATION_STATUS_CHANGE',
        //  'ACCIDENT_SCENE',
        'GLASS_STATUS_CHANGE',
        'MONITOR_STATUS_CHANGE',
        'SPEED_UPDATE',
        'AMBULANCE_ETA',
       ], default: '' },
       notificaton_status: { type: Number, default:0 },
       notification_data: { type: String, default: '' },
       priority: { type: Number, default:0 },
      },
      { timestamps: true }
    );

    schema.index({ user_id: 1 });
    const notificationDrivers = mongoose.model("notification_drivers", schema);
  
    return notificationDrivers;
  };