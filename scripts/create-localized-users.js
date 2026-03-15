const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createUsers() {
    try {
        await mongoose.connect('mongodb+srv://Cluster22485:Eff9HciYRZQ6Vydt@cluster22485.yhtxpck.mongodb.net/foodbridge?appName=Cluster22485');
        const db = mongoose.connection;
        const id = Math.floor(Math.random() * 10000);

        const donorEmail = `donor.hyd${id}@example.com`;
        const verifiedNgoEmail = `ngo.hyd.verified${id}@example.com`;
        const unverifiedNgoEmail = `ngo.hyd.locked${id}@example.com`;
        const passwordHash = await bcrypt.hash('password123', 10);

        console.log(`Creating Donor (Hyderabad): ${donorEmail}`);
        const donorRes = await db.collection('users').insertOne({
            name: 'TechHub Donor',
            email: donorEmail,
            password: passwordHash,
            role: 'donor',
            phone: '9999999999',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500033',
            address: 'Plot 10, Jubilee Hills',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`Creating VERIFIED NGO (Hyderabad): ${verifiedNgoEmail}`);
        const vNgoRes = await db.collection('users').insertOne({
            name: 'Hyderabad Relief Org',
            email: verifiedNgoEmail,
            password: passwordHash,
            role: 'ngo',
            phone: '8888888888',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500033',
            address: 'Plot 10, Jubilee Hills',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await db.collection('ngoprofiles').insertOne({
            userId: vNgoRes.insertedId,
            ngoName: 'Hyderabad Relief Org',
            registrationNumber: `NGO-HYD-V-${id}`,
            verificationStatus: 'approved',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`Creating UNVERIFIED NGO (Hyderabad): ${unverifiedNgoEmail}`);
        const uNgoRes = await db.collection('users').insertOne({
            name: 'New Hope NGO',
            email: unverifiedNgoEmail,
            password: passwordHash,
            role: 'ngo',
            phone: '7777777777',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500033',
            address: 'Plot 10, Jubilee Hills',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await db.collection('ngoprofiles').insertOne({
            userId: uNgoRes.insertedId,
            ngoName: 'New Hope NGO',
            registrationNumber: `NGO-HYD-U-${id}`,
            verificationStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('\n--- HYDERABAD CREDENTIALS ---');
        console.log(`[DONOR]`);
        console.log(`Email: ${donorEmail}`);
        console.log(`Password: password123`);
        console.log('');
        console.log(`[NGO - VERIFIED & CAN ACCEPT]`);
        console.log(`Email: ${verifiedNgoEmail}`);
        console.log(`Password: password123`);
        console.log('');
        console.log(`[NGO - UNVERIFIED / LOCKED]`);
        console.log(`Email: ${unverifiedNgoEmail}`);
        console.log(`Password: password123`);
        console.log('-------------------------------');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

createUsers();
