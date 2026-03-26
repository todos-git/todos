const { MongoClient } = require("mongodb");

const uri =
    "mongodb+srv://jayson11irving_db_user:Tugsuu0812@cluster0.2on2qe0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const sourceDbName = "test";
const targetDbName = "todos";

const collectionsToCopy = [
    "users",
    "products",
    "orders",
    "carts",
    "payments",
    "bannerads",
    "withdraws",
    "termacceptances",
];

async function migrate() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("MongoDB connected");

        const sourceDb = client.db(sourceDbName);
        const targetDb = client.db(targetDbName);

        for (const collectionName of collectionsToCopy) {
            const sourceCollection = sourceDb.collection(collectionName);
            const targetCollection = targetDb.collection(collectionName);

            const docs = await sourceCollection.find({}).toArray();

            if (docs.length === 0) {
                console.log(`Skipping ${collectionName}: no documents found`);
                continue;
            }

            await targetCollection.deleteMany({});
            await targetCollection.insertMany(docs);

            console.log(`Copied ${docs.length} docs: ${collectionName}`);
        }

        console.log("Migration completed successfully");
    } catch (error) {
        console.error("Migration error:", error);
    } finally {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

migrate();