#!/usr/bin/env node
/**
 * CampusHire - Administrative Placement Officer Provisioning CLI
 *
 * Secure administrator utility to provision legitimate Placement Officers
 * in Firebase Authentication (with custom claims) and MongoDB Atlas.
 *
 * Usage:
 *   node scripts/provision-officer.js --email tpo@nite.edu.in --name "Dr. Radhika Menon" --designation "Head of Placements" [--password "Secret@123"] [--office "Admin 204"] [--phone "+91 9876543210"]
 */

import '../src/loadEnv.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import {
  isFirebaseAdminConfigured,
  getFirebaseUserByEmail,
  setFirebaseUserClaims,
  createFirebaseOfficerUser,
} from '../src/config/firebaseAdmin.js';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      options[key] = val;
    }
  }
  return options;
}

async function main() {
  console.log('====================================================');
  console.log('   CampusHire - Administrative Officer Provisioning  ');
  console.log('====================================================');

  const options = parseArgs();
  const email = (options.email || '').trim().toLowerCase();
  const name = (options.name || '').trim();
  const designation = (options.designation || 'Placement Officer').trim();
  const officeRoom = (options.office || options.officeRoom || 'Training & Placement Office').trim();
  const phone = (options.phone || '').trim();
  const password = options.password ? String(options.password) : null;

  if (!email || !email.includes('@')) {
    console.error('\n[Error] Valid institutional officer email is required (--email <email>).');
    console.log('\nExample:');
    console.log('  npm run provision:officer -- --email tpo@nite.edu.in --name "Dr. Radhika Menon" --password "Admin@TPO2026"');
    process.exit(1);
  }

  if (!name) {
    console.error('\n[Error] Officer name is required (--name "<Full Name>").');
    process.exit(1);
  }

  // 1. Firebase Authentication Verification and Provisioning
  console.log(`\n[1/3] Checking Firebase Authentication for ${email}...`);
  let fbUser = null;

  if (isFirebaseAdminConfigured()) {
    try {
      fbUser = await getFirebaseUserByEmail(email);
      if (fbUser) {
        console.log(`  ✓ Found existing Firebase user (UID: ${fbUser.uid})`);
        console.log('  ✓ Setting Firebase custom claim: { role: "placement_officer" }...');
        await setFirebaseUserClaims(fbUser.uid, { role: 'placement_officer' });
        console.log('  ✓ Firebase custom claims updated successfully.');
      } else if (password) {
        console.log('  + User not found in Firebase. Creating officer account with provided credentials...');
        fbUser = await createFirebaseOfficerUser({
          email,
          password,
          displayName: name,
        });
        console.log(`  ✓ Firebase officer user created successfully (UID: ${fbUser.uid}) with custom claims.`);
      } else {
        console.log('  ℹ User does not exist in Firebase Auth yet.');
        console.log('    You can create the user in Firebase Console or pass --password "<tempPassword>".');
        console.log('    The MongoDB record will be pre-provisioned and will bind on first login.');
      }
    } catch (fbErr) {
      console.error('  [Warning] Firebase operation notice:', fbErr.message);
    }
  } else {
    console.log('  ℹ Firebase Admin credentials not fully configured; skipping cloud claim sync.');
  }

  // 2. MongoDB Atlas Record Provisioning
  console.log(`\n[2/3] Provisioning authoritative Placement Officer profile in MongoDB Atlas...`);
  if (!process.env.MONGODB_URI) {
    console.error('  [Error] MONGODB_URI is not set in backend/.env.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'campushire',
    });
    console.log('  ✓ Connected to MongoDB Atlas cluster.');

    let officer = await User.findOne({ email });

    if (officer) {
      console.log(`  ✓ Found existing user record in MongoDB (Current Role: ${officer.role})`);
      officer.role = 'placement_officer';
      officer.name = name;
      if (fbUser) {
        officer.firebaseUid = fbUser.uid;
      }
      officer.officerProfile = {
        designation,
        officeRoom,
        phone: phone || officer.officerProfile?.phone || '',
      };
      await officer.save();
      console.log('  ✓ Updated user record with authoritative role: "placement_officer".');
    } else {
      officer = new User({
        name,
        email,
        role: 'placement_officer',
        firebaseUid: fbUser?.uid || undefined,
        officerProfile: {
          designation,
          officeRoom,
          phone,
        },
      });
      await officer.save();
      console.log('  ✓ Created new authoritative Placement Officer profile in MongoDB.');
    }

    console.log('\n[3/3] Verification & Integrity Summary:');
    console.log('----------------------------------------------------');
    console.log(`  Name:           ${officer.name}`);
    console.log(`  Email:          ${officer.email}`);
    console.log(`  Verified Role:  ${officer.role}`);
    console.log(`  Designation:    ${officer.officerProfile?.designation}`);
    console.log(`  Office:         ${officer.officerProfile?.officeRoom}`);
    console.log(`  Firebase UID:   ${officer.firebaseUid || '(Pending first login binding)'}`);
    console.log('----------------------------------------------------');
    console.log('✓ Success: Officer is authorized to sign in under the Placement Officer tab.\n');
  } catch (dbErr) {
    console.error('\n[Error] Database provisioning failed:', dbErr.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main().catch((err) => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});
