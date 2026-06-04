const admin = require('firebase-admin');

// 1. Load your exported JSON file
const databaseData = require('./identity-verification-sy-dd573-default-rtdb-export.json');

// 2. Load your Service Account Key
const serviceAccount = require('./serviceAccountKey.json');

// 3. Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
    console.log('Starting automated migration...');

    // 4. Automatically detect all top-level nodes (Collections) in the JSON
    const collections = Object.keys(databaseData);
    let totalMigrated = 0;

    for (const collectionName of collections) {
        console.log(`\nFound Collection: [${collectionName}]`);
        const documents = databaseData[collectionName];

        // 5. Loop through every item inside the node and write it as a Document
        for (const [documentId, documentContent] of Object.entries(documents)) {
            try {
                await db.collection(collectionName).doc(documentId).set(documentContent);
                totalMigrated++;
                console.log(`  -> Successfully migrated document ID: ${documentId}`);
            } catch (error) {
                console.error(`  -> Failed to migrate document ID: ${documentId}`, error);
            }
        }
    }

    console.log(`\nMigration fully complete! Successfully moved ${totalMigrated} total documents into Firestore.`);
}

// Execute the function
migrateData();