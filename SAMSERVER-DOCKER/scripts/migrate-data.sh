#!/bin/bash

# AOC V2 Data Migration Script
# Migrates data from old API server (117.18.126.117) to new centralized server (103.22.182.145)

set -e

echo "🚀 Starting AOC V2 Data Migration..."
echo "📅 $(date)"
echo ""

# Configuration
OLD_MONGODB_URL="mongodb://admin:ThaiAocV21%40@117.18.126.117:27017/aoc_v2?authSource=admin"
NEW_MONGODB_URL="mongodb://admin:ThaiAocV21%40@103.22.182.145:27017/aoc_v2?authSource=admin"
BACKUP_DIR="./backup/$(date +%Y%m%d-%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup of old database..."
mongodump --uri="$OLD_MONGODB_URL" --out="$BACKUP_DIR"

echo "✅ Backup created at: $BACKUP_DIR"
echo ""

echo "🔄 Starting data migration..."

# List of collections to migrate
COLLECTIONS=(
    "ambulances"
    "ambulance_trackings"
    "ambulance_tracking_histories"
    "ambulance_images"
    "ambulance_image_histories"
    "ambulance_crashes"
    "aoc_requests"
    "aoc_users"
    "aoc_zones"
    "hospitals"
    "patient_monitors"
    "glass_macs"
    "medical_equipments"
    "communication_devices"
    "ambulance_equipments"
    "ambulance_types"
    "ambulance_service_maintenances"
    "aoc_ems_staffs"
    "aoc_er_staffs"
    "emt_staffs"
    "doctors"
    "nurses"
    "drivers"
    "paramedics"
    "first_responders"
    "volunteers"
    "user_devices"
    "user_device_types"
    "user_notifications"
    "area_management"
    "medical_devices"
    "patient_situations"
    "ambulance_communication_devices"
    "ambulance_equipment_catalogies"
    "alive_users"
)

# Migrate each collection
for collection in "${COLLECTIONS[@]}"; do
    echo "📋 Migrating collection: $collection"
    
    # Export from old database
    mongoexport --uri="$OLD_MONGODB_URL" --collection="$collection" --out="$BACKUP_DIR/${collection}.json"
    
    # Import to new database
    mongoimport --uri="$NEW_MONGODB_URL" --collection="$collection" --file="$BACKUP_DIR/${collection}.json" --upsert
    
    echo "✅ Migrated: $collection"
done

echo ""
echo "🎉 Data migration completed successfully!"
echo "📊 Migrated collections: ${#COLLECTIONS[@]}"
echo "💾 Backup location: $BACKUP_DIR"
echo ""

# Verify migration
echo "🔍 Verifying migration..."
for collection in "${COLLECTIONS[@]}"; do
    old_count=$(mongosh --quiet --uri="$OLD_MONGODB_URL" --eval "db.${collection}.countDocuments()" | tail -1)
    new_count=$(mongosh --quiet --uri="$NEW_MONGODB_URL" --eval "db.${collection}.countDocuments()" | tail -1)
    
    if [ "$old_count" -eq "$new_count" ]; then
        echo "✅ $collection: $old_count documents migrated"
    else
        echo "❌ $collection: Mismatch! Old: $old_count, New: $new_count"
    fi
done

echo ""
echo "🏁 Migration process completed!"
echo "📅 $(date)"