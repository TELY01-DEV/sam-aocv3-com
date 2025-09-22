// MongoDB Initialization Script for AOC V2 System

// Create the main database
db = db.getSiblingDB('aoc_v2');

// Create collections with proper indexes
db.createCollection('ambulances');
db.createCollection('ambulance_trackings');
db.createCollection('ambulance_tracking_histories');
db.createCollection('ambulance_images');
db.createCollection('ambulance_image_histories');
db.createCollection('ambulance_crashes');
db.createCollection('aoc_requests');
db.createCollection('aoc_users');
db.createCollection('aoc_zones');
db.createCollection('hospitals');
db.createCollection('patient_monitors');
db.createCollection('glass_macs');
db.createCollection('medical_equipments');
db.createCollection('communication_devices');
db.createCollection('ambulance_equipments');
db.createCollection('ambulance_types');
db.createCollection('ambulance_service_maintenances');
db.createCollection('aoc_ems_staffs');
db.createCollection('aoc_er_staffs');
db.createCollection('emt_staffs');
db.createCollection('doctors');
db.createCollection('nurses');
db.createCollection('drivers');
db.createCollection('paramedics');
db.createCollection('first_responders');
db.createCollection('volunteers');
db.createCollection('user_devices');
db.createCollection('user_device_types');
db.createCollection('user_notifications');
db.createCollection('area_management');
db.createCollection('medical_devices');
db.createCollection('patient_situations');
db.createCollection('ambulance_communication_devices');
db.createCollection('ambulance_equipment_catalogies');
db.createCollection('alive_users');

// Create indexes for performance
db.ambulances.createIndex({ "ambulance_id": 1 }, { unique: true });
db.ambulances.createIndex({ "hospital_id": 1 });
db.ambulances.createIndex({ "status": 1 });
db.ambulances.createIndex({ "created_at": 1 });

db.ambulance_trackings.createIndex({ "ambulance_id": 1 });
db.ambulance_trackings.createIndex({ "tracking_latitude": 1, "tracking_longitude": 1 });
db.ambulance_trackings.createIndex({ "tracking_timestamp": 1 });
db.ambulance_trackings.createIndex({ "ambulance_id": 1, "tracking_timestamp": 1 });

db.ambulance_tracking_histories.createIndex({ "ambulance_id": 1 });
db.ambulance_tracking_histories.createIndex({ "tracking_timestamp": 1 });
db.ambulance_tracking_histories.createIndex({ "ambulance_id": 1, "tracking_timestamp": 1 });

db.ambulance_images.createIndex({ "ambulance_id": 1 });
db.ambulance_images.createIndex({ "image_timestamp": 1 });
db.ambulance_images.createIndex({ "ambulance_id": 1, "image_timestamp": 1 });

db.ambulance_image_histories.createIndex({ "ambulance_id": 1 });
db.ambulance_image_histories.createIndex({ "image_timestamp": 1 });

db.ambulance_crashes.createIndex({ "ambulance_id": 1 });
db.ambulance_crashes.createIndex({ "crash_timestamp": 1 });
db.ambulance_crashes.createIndex({ "status": 1 });

db.aoc_requests.createIndex({ "request_id": 1 }, { unique: true });
db.aoc_requests.createIndex({ "hospital_id": 1 });
db.aoc_requests.createIndex({ "ambulance_id": 1 });
db.aoc_requests.createIndex({ "status": 1 });
db.aoc_requests.createIndex({ "created_at": 1 });
db.aoc_requests.createIndex({ "request_latitude": 1, "request_longitude": 1 });

db.aoc_users.createIndex({ "user_id": 1 }, { unique: true });
db.aoc_users.createIndex({ "email": 1 }, { unique: true });
db.aoc_users.createIndex({ "phone": 1 });
db.aoc_users.createIndex({ "role": 1 });
db.aoc_users.createIndex({ "status": 1 });

db.hospitals.createIndex({ "hospital_id": 1 }, { unique: true });
db.hospitals.createIndex({ "hospital_name": 1 });
db.hospitals.createIndex({ "hospital_latitude": 1, "hospital_longitude": 1 });
db.hospitals.createIndex({ "status": 1 });

db.patient_monitors.createIndex({ "monitor_id": 1 }, { unique: true });
db.patient_monitors.createIndex({ "ambulance_id": 1 });
db.patient_monitors.createIndex({ "status": 1 });

db.glass_macs.createIndex({ "glass_mac_id": 1 }, { unique: true });
db.glass_macs.createIndex({ "ambulance_id": 1 });
db.glass_macs.createIndex({ "status": 1 });

// Create admin user
db.createUser({
  user: "admin",
  pwd: "ThaiAocV21@",
  roles: [
    { role: "readWrite", db: "aoc_v2" },
    { role: "dbAdmin", db: "aoc_v2" }
  ]
});

// Create application user
db.createUser({
  user: "aoc_app",
  pwd: "aocv2@123!",
  roles: [
    { role: "readWrite", db: "aoc_v2" }
  ]
});

print("MongoDB initialization completed successfully!");
print("Database: aoc_v2");
print("Collections created: " + db.getCollectionNames().length);
print("Indexes created for optimal performance");
print("Users created: admin, aoc_app");