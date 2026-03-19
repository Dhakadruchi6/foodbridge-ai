const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const HungerSpotSchema = new mongoose.Schema({
    name: String,
    lat: Number,
    lng: Number,
    peopleCount: Number,
    category: String,
    urgency: String,
    isActive: Boolean,
}, { timestamps: true });

const HungerSpot = mongoose.models.HungerSpot || mongoose.model('HungerSpot', HungerSpotSchema);

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const spots = [
        {
            name: 'Central Slum Area',
            lat: 37.7749, // Near SF
            lng: -122.4194,
            peopleCount: 150,
            category: 'slum',
            urgency: 'high',
            isActive: true
        },
        {
            name: 'East Side Shelter',
            lat: 37.7849,
            lng: -122.4094,
            peopleCount: 80,
            category: 'shelter',
            urgency: 'medium',
            isActive: true
        },
        {
            name: 'Grace Community Kitchen',
            lat: 37.7649,
            lng: -122.4294,
            peopleCount: 60,
            category: 'community_center',
            urgency: 'low',
            isActive: true
        },
        {
            name: 'St. Mary Orphanage',
            lat: 37.7949,
            lng: -122.4394,
            peopleCount: 45,
            category: 'orphanage',
            urgency: 'high',
            isActive: true
        }
    ];

    await HungerSpot.deleteMany({});
    await HungerSpot.insertMany(spots);

    console.log('Seeded 4 hunger spots successfully');
    process.exit();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
