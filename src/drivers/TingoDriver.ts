import { DatabaseDriver } from './DriverInterface.js';
import { QueryIR, ModelMetadata } from '../types.js';
import { mkdirSync } from 'fs';

interface TingoDriverConfig {
    path: string;
}

export class TingoDriver implements DatabaseDriver {
    private db: any;
    public raw: any;

    async connect(config: TingoDriverConfig): Promise<void> {
        mkdirSync(config.path || './db/tingodb', { recursive: true });
        try {
            // @ts-ignore - optional peer dependency
            const tingoModule = await import('tingodb');
            const factory = tingoModule.default || tingoModule;
            const tingodb = typeof factory === 'function' ? factory() : new factory.Db(config.path || './db/tingodb', {});
            const Db = tingodb.Db || factory.Db;
            this.db = new Db(config.path || './db/tingodb', {});
            this.raw = this.db;
        } catch {
            const { createRequire } = await import('module');
            const req = createRequire(import.meta.url);
            // @ts-ignore - optional peer dependency
            const tingodb = req('tingodb')();
            this.db = new tingodb.Db(config.path || './db/tingodb', {});
            this.raw = this.db;
        }
    }

    async disconnect(): Promise<void> {}

    async find(collection: string, query: QueryIR): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const filter = this.buildFilter(query);
            const cursor = this.db.collection(collection).find(filter);
            if (query.select) {
                const projection: Record<string, number> = {};
                for (const f of query.select) projection[f] = 1;
                cursor.project(projection);
            }
            if (query.sort) {
                const sort: Record<string, number> = {};
                for (const s of query.sort) sort[s.field] = s.dir === 'asc' ? 1 : -1;
                cursor.sort(sort);
            }
            if (query.offset) cursor.skip(query.offset);
            if (query.limit) cursor.limit(query.limit);
            cursor.toArray((err: any, docs: any[]) => {
                if (err) reject(err);
                else resolve(docs || []);
            });
        });
    }

    async findOne(collection: string, query: QueryIR): Promise<any | null> {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).findOne(this.buildFilter(query), (err: any, doc: any) => {
                if (err) reject(err);
                else resolve(doc || null);
            });
        });
    }

    async insert(collection: string, data: Record<string, any>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).insert(data, (err: any, docs: any[]) => {
                if (err) reject(err);
                else resolve(docs[0]);
            });
        });
    }

    async update(collection: string, query: QueryIR, data: Record<string, any>): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).update(
                this.buildFilter(query),
                { $set: data },
                { multi: true },
                (err: any, count: number) => {
                    if (err) reject(err);
                    else resolve(count);
                }
            );
        });
    }

    async delete(collection: string, query: QueryIR): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).remove(this.buildFilter(query), (err: any, count: number) => {
                if (err) reject(err);
                else resolve(count);
            });
        });
    }

    async count(collection: string, query: QueryIR): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).count(this.buildFilter(query), (err: any, count: number) => {
                if (err) reject(err);
                else resolve(count);
            });
        });
    }

    async ensureSchema(_metadata: ModelMetadata): Promise<void> {}

    async dropCollection(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.dropCollection(name, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async listCollections(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.db.collections((err: any, names: string[]) => {
                if (err) reject(err);
                else resolve(names || []);
            });
        });
    }

    private buildFilter(query: QueryIR): Record<string, any> {
        if (!query.where || query.where.length === 0) return {};
        const filter: Record<string, any> = {};
        for (const clause of query.where) {
            if (clause.operator === 'eq') {
                filter[clause.field] = clause.value;
            } else if (clause.operator === 'like') {
                filter[clause.field] = { $regex: clause.value };
            } else {
                filter[clause.field] = { ['$' + clause.operator]: clause.value };
            }
        }
        return filter;
    }
}
