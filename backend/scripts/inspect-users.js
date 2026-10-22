import '../src/loadEnv.js';
import { initFirebaseAdmin } from '../src/config/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

async function main() {
  console.log('--- Checking Firebase Auth Users ---');
  const app = initFirebaseAdmin();
  if (app) {
    const auth = getAuth(app);
    const list = await auth.listUsers(50);
    console.log(`Found ${list.users.length} users in Firebase:`);
    for (const u of list.users) {
      console.log(`- UID: ${u.uid}, Email: ${u.email}, Claims:`, u.customClaims || {});
    }
  } else {
    console.log('Firebase Admin not initialized');
  }

  console.log('\n--- Checking MongoDB Atlas Users ---');
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'campushire' });
    const users = await User.find({});
    console.log(`Found ${users.length} users in MongoDB:`);
    for (const u of users) {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, FirebaseUid: ${u.firebaseUid}, Name: ${u.name}`);
    }
    await mongoose.disconnect();
  } else {
    console.log('MONGODB_URI not set');
  }
}

main().catch(console.error);
