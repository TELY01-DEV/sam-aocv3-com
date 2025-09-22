module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
        {
            user_id: ObjectId,
            designation_id: ObjectId,
            aoc: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
            rmt_hos: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
            ccc: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
            ekg: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
            er: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
            aoc_tv: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
            aoc_tv_oneonetwo: {
                acns: { type: Boolean, default: false },
                ambulance_status_change: { type: Boolean, default: false },
                operation_status_change: { type: Boolean, default: false },
                arrival_at_scene: { type: Boolean, default: false },
                glass_mac_status_change: { type: Boolean, default: false },
                patient_monitor_status_change: { type: Boolean, default: false },
                ambulance_speed: { type: Boolean, default: false },
                ambulance_estimated_time: { type: Boolean, default: false }
            },
        },
        { timestamps: true }
    );

    schema.index({ user_id: 1, designation_id: 1, createdAt: 1, updatedAt: 1 });
    const UserNotificationSettings = mongoose.model("user_notification_settings", schema);

    return UserNotificationSettings;
};