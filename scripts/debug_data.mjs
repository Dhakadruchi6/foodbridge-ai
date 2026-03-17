import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const ngos = await mongoose.connection.db.collection('ngoprofiles').find({}).toArray();
        console.log(`Total NGOs: ${ngos.length}`);
        ngos.forEach(ngo => {
            console.log(`- ${ngo.ngoName}: ${ngo.latitude}, ${ngo.longitude} (Status: ${ngo.verificationStatus})`);
        });

        const latestDonation = await mongoose.connection.db.collection('donations').find({}).sort({ createdAt: -1 }).limit(1).toArray();
        if (latestDonation.length > 0) {
            console.log(`Latest Donation: ${latestDonation[0].foodType}`);
            console.log(`Coords: ${latestDonation[0].latitude}, ${latestDonation[0].longitude}`);
        }

    } catch (err) {
        console.error('Debug script failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
