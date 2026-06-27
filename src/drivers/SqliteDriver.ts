import { DatabaseDriver } from './DriverInterface.js';
import { QueryIR, ModelMetadata } from '../types.js';
import { SqlCompiler } from '../compiler/SqlCompiler.js';

interface SqliteDriverConfig {
    filename: string;
}

export class SqliteDriver implements DatabaseDriver {
    private db: any;
    private compiler = new SqlCompiler();
    public raw: any;

    async connect(config: SqliteDriverConfig): Promise<void> {
        // @ts-ignore - optional peer dependency
        const BetterSqlite3 = await import('better-sqlite3');
        this.db = new BetterSqlite3.default(config.filename || ':memory:');
        this.db.pragma('journal_mode = WAL');
        this.raw = this.db;
    }

    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
        }
    }

    async find(collection: string, query: QueryIR): Promise<any[]> {
        const { sql, params } = this.compiler.compileSelect(query);
        return this.db.prepare(sql).all(...params);
    }

    async findOne(collection: string, query: QueryIR): Promise<any | null> {
        const limited = { ...query, limit: 1 };
        const results = await this.find(collection, limited);
        return results.length > 0 ? results[0] : null;
    }

    async insert(collection: string, data: Record<string, any>): Promise<any> {
        const { sql, params } = this.compiler.compileInsert(collection, data);
        const result = this.db.prepare(sql).run(...params);
        return { id: result.lastInsertRowid, ...data };
    }

    async update(collection: string, query: QueryIR, data: Record<string, any>): Promise<number> {
        const { sql, params } = this.compiler.compileUpdate(collection, data, query);
        const result = this.db.prepare(sql).run(...params);
        return result.changes;
    }

    async delete(collection: string, query: QueryIR): Promise<number> {
        const { sql, params } = this.compiler.compileDelete(collection, query);
        const result = this.db.prepare(sql).run(...params);
        return result.changes;
    }

    async count(collection: string, query: QueryIR): Promise<number> {
        const { sql, params } = this.compiler.compileCount(collection, query);
        const result = this.db.prepare(sql).get(...params);
        return result?.count || 0;
    }

    async ensureSchema(metadata: ModelMetadata): Promise<void> {
        const fields = metadata.fields.map(f => ({
            name: f.name,
            type: f.type,
            primary: f.primary,
            nullable: f.nullable,
            unique: f.unique,
        }));
        const sql = this.compiler.compileCreateTable(metadata.collection, fields);
        this.db.exec(sql);
    }

    async dropCollection(name: string): Promise<void> {
        this.db.exec(`DROP TABLE IF EXISTS ${name}`);
    }

    async listCollections(): Promise<string[]> {
        const rows = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_zumito_%' AND name NOT LIKE 'sqlite_%'`).all();
        return rows.map((r: any) => r.name);
    }

    async transaction<T>(fn: (trx: any) => Promise<T>): Promise<T> {
        const trx = this.db.transaction(async () => {
            return fn(trx);
        });
        return trx();
    }
}
