import { DatabaseDriver } from './drivers/DriverInterface.js';
import { DatabaseConfig, ModelMetadata } from './types.js';
import { Repository } from './Repository.js';
import { buildModelMetadata, getModelMetadata } from './metadata/ModelMetadata.js';
import { MigrationRunner } from './migrations/MigrationRunner.js';
import { Migrator } from './migrations/Migrator.js';
import { MemoryDriver } from './drivers/MemoryDriver.js';

export class DatabaseManager {
    private driver!: DatabaseDriver;
    private repositories = new Map<string, Repository<any>>();
    private modelMetadata = new Map<string, ModelMetadata>();
    private migrationRunner: MigrationRunner;
    private _migrator: Migrator;
    private _config!: DatabaseConfig;

    constructor() {
        this.migrationRunner = new MigrationRunner(this);
        this._migrator = new Migrator(this, this.migrationRunner);
    }

    get migrator(): Migrator {
        return this._migrator;
    }

    async connect(config: DatabaseConfig): Promise<void> {
        this._config = config;
        this.driver = await this.loadDriver(config.default, config.drivers[config.default]);
        await this.driver.connect(config.drivers[config.default]);

        if (config.models) {
            for (const Model of config.models) {
                this.registerModel(Model);
            }
        }
    }

    async disconnect(): Promise<void> {
        if (this.driver) {
            await this.driver.disconnect();
        }
    }

    registerModel(modelClass: any): void {
        const metadata = getModelMetadata(modelClass) || buildModelMetadata(modelClass);
        this.modelMetadata.set(metadata.collection, metadata);
    }

    getRepository<T>(modelClass: any): Repository<T> {
        const metadata = getModelMetadata(modelClass) || buildModelMetadata(modelClass);
        if (!this.repositories.has(metadata.collection)) {
            this.repositories.set(metadata.collection, new Repository<T>(this.driver, metadata));
        }
        return this.repositories.get(metadata.collection) as Repository<T>;
    }

    async ensureSchemas(): Promise<void> {
        for (const [, metadata] of this.modelMetadata) {
            await this.driver.ensureSchema(metadata);
        }
    }

    getDriver(): DatabaseDriver {
        return this.driver;
    }

    async transaction<T>(fn: (db: DatabaseManager) => Promise<T>): Promise<T> {
        if (!this.driver.transaction) {
            throw new Error('Transactions are not supported by this driver');
        }
        return this.driver.transaction(async (_session: any) => {
            return fn(this);
        });
    }

    async dropCollection(name: string): Promise<void> {
        await this.driver.dropCollection(name);
    }

    async listCollections(): Promise<string[]> {
        return this.driver.listCollections();
    }

    getCollectionMetadata(): { name: string; fields: any[]; relations: any[] }[] {
        return Array.from(this.modelMetadata.values()).map(m => ({
            name: m.collection,
            fields: m.fields.map(f => ({
                name: f.name,
                propertyKey: f.propertyKey,
                type: f.type,
                primary: f.primary,
                unique: f.unique,
                nullable: f.nullable,
                default: f.default,
            })),
            relations: m.relations,
        }));
    }

    private async loadDriver(name: string, _config: Record<string, any>): Promise<DatabaseDriver> {
        switch (name) {
            case 'memory':
                return new MemoryDriver();
            case 'mongo': {
                const mod = await import('./drivers/MongoDriver.js');
                return new mod.MongoDriver();
            }
            case 'sqlite': {
                const mod = await import('./drivers/SqliteDriver.js');
                return new mod.SqliteDriver();
            }
            case 'tingo': {
                const mod = await import('./drivers/TingoDriver.js');
                return new mod.TingoDriver();
            }
            default:
                throw new Error(`Unknown driver: ${name}. Available drivers: memory, mongo, sqlite, tingo`);
        }
    }
}
