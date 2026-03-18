import mongoose from 'mongoose';
import NGOProfile from '../models/NGOProfile';
import Donation from '../models/Donation';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to DB');

        const ngoCount = await NGOProfile.countDocuments();
        const approvedNgosWithCoords = await NGOProfile.countDocuments({
            verificationStatus: 'approved',
            latitude: { $ne: null },
            longitude: { $ne: null }
        });

        console.log(`Total NGOs: ${ngoCount}`);
        console.log(`Approved NGOs with coordinates: ${approvedNgosWithCoords}`);

        const latestDonation = await Donation.findOne().sort({ createdAt: -1 });
        if (latestDonation) {
            console.log(`Latest Donation: ${latestDonation.foodType}`);
            console.log(`Donation Coords: ${latestDonation.latitude}, ${latestDonation.longitude}`);
            console.log(`Donation Expiry: ${latestDonation.expiryTime}`);
        } else {
            console.log('No donations found');
        }

        const sampleNGOs = await NGOProfile.find({ verificationStatus: 'approved' }).limit(3);
        console.log('Sample Approved NGOs:');
        sampleNGOs.forEach(ngo => {
            console.log(`- ${ngo.ngoName}: ${ngo.latitude}, ${ngo.longitude} (Urgency: ${ngo.urgency}, Capacity: ${ngo.capacity})`);
        });

    } catch (err) {
        console.error('Debug script failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
