import { DatabaseManager } from '../DatabaseManager.js';
import { Migration } from './Migration.js';

export class MigrationRunner {
    private db: DatabaseManager;
    private migrationsTable = '_zumito_migrations';

    constructor(db: DatabaseManager) {
        this.db = db;
    }

    async ensureMigrationsTable(): Promise<void> {
        const driver = this.db.getDriver();
        const metadata = {
            name: 'MigrationRecord',
            collection: this.migrationsTable,
            fields: [
                { name: 'name', type: 'string' as const, primary: true, unique: true, nullable: false, propertyKey: 'name' },
                { name: 'executed_at', type: 'string' as const, primary: false, unique: false, nullable: false, propertyKey: 'executedAt' },
            ],
            relations: [],
            target: null,
        };
        await driver.ensureSchema(metadata);
    }

    async getExecuted(): Promise<string[]> {
        const driver = this.db.getDriver();
        const results = await driver.find(this.migrationsTable, {
            collection: this.migrationsTable,
            type: 'find',
            where: [],
        });
        return results.map((r: any) => r.name);
    }

    async runUp(migration: Migration): Promise<void> {
        await this.ensureMigrationsTable();
        await migration.up(this.db);
        await this.db.getDriver().insert(this.migrationsTable, {
            name: migration.name,
            executed_at: new Date().toISOString(),
        });
    }

    async runDown(migration: Migration): Promise<void> {
        await migration.down(this.db);
        await this.db.getDriver().delete(this.migrationsTable, {
            collection: this.migrationsTable,
            type: 'delete',
            where: [{ field: 'name', operator: 'eq', value: migration.name, logic: 'and' }],
        });
    }
}
