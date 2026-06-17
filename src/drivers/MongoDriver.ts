import { DatabaseDriver } from './DriverInterface.js';
import { QueryIR, ModelMetadata } from '../types.js';
import { MongoCompiler } from '../compiler/MongoCompiler.js';

interface MongoDriverConfig {
    uri: string;
    database?: string;
}

export class MongoDriver implements DatabaseDriver {
    private client: any;
    private db: any;
    private compiler = new MongoCompiler();
    public raw: any;

    async connect(config: MongoDriverConfig): Promise<void> {
        const { MongoClient } = await import('mongodb');
        this.client = new MongoClient(config.uri);
        await this.client.connect();
        const dbName = config.database || this.extractDbName(config.uri);
        this.db = this.client.db(dbName);
        this.raw = this.db;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
    }

    async find(collection: string, query: QueryIR): Promise<any[]> {
        const { filter, options } = this.compiler.compileFind(query);
        const col = this.db.collection(collection);
        let cursor = col.find(filter, options);
        const results = await cursor.toArray();
        return results;
    }

    async findOne(collection: string, query: QueryIR): Promise<any | null> {
        const { filter, options } = this.compiler.compileFind(query);
        const col = this.db.collection(collection);
        return col.findOne(filter, options);
    }

    async insert(collection: string, data: Record<string, any>): Promise<any> {
        const col = this.db.collection(collection);
        const result = await col.insertOne(data);
        return { _id: result.insertedId, ...data };
    }

    async update(collection: string, query: QueryIR, data: Record<string, any>): Promise<number> {
        const { filter } = this.compiler.compileFind(query);
        const col = this.db.collection(collection);
        const result = await col.updateMany(filter, this.compiler.compileUpdate(data));
        return result.modifiedCount;
    }

    async delete(collection: string, query: QueryIR): Promise<number> {
        const { filter } = this.compiler.compileFind(query);
        const col = this.db.collection(collection);
        const result = await col.deleteMany(filter);
        return result.deletedCount;
    }

    async count(collection: string, query: QueryIR): Promise<number> {
        const { filter } = this.compiler.compileFind(query);
        const col = this.db.collection(collection);
        return col.countDocuments(filter);
    }

    async ensureSchema(metadata: ModelMetadata): Promise<void> {
        const collections = await this.db.listCollections().toArray();
        const exists = collections.some((c: any) => c.name === metadata.collection);
        if (!exists) {
            await this.db.createCollection(metadata.collection);
        }
        // Create indexes for primary/unique fields
        for (const field of metadata.fields) {
            if (field.primary || field.unique) {
                const col = this.db.collection(metadata.collection);
                await col.createIndex({ [field.name]: 1 }, { unique: true });
            }
        }
    }

    async dropCollection(name: string): Promise<void> {
        await this.db.collection(name).drop().catch(() => {});
    }

    async transaction<T>(fn: (session: any) => Promise<T>): Promise<T> {
        const session = this.client.startSession();
        try {
            session.startTransaction();
            const result = await fn(session);
            await session.commitTransaction();
            return result;
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    private extractDbName(uri: string): string {
        const match = uri.match(/\/([^/?]+)(\?|$)/);
        return match ? match[1] : 'zumito';
    }
}
