import { DatabaseDriver } from './drivers/DriverInterface.js';
import { ModelMetadata, WhereClause, Operator } from './types.js';
import { QueryBuilder } from './QueryBuilder.js';

export class Repository<T = any> {
    private driver: DatabaseDriver;
    private metadata: ModelMetadata;

    constructor(driver: DatabaseDriver, metadata: ModelMetadata) {
        this.driver = driver;
        this.metadata = metadata;
    }

    get collection(): string {
        return this.metadata.collection;
    }

    async find(where?: Partial<T>): Promise<T[]> {
        const ir = {
            collection: this.metadata.collection,
            type: 'find' as const,
            where: where ? this.toWhereClauses(where) : [],
        };
        return this.driver.find(this.metadata.collection, ir);
    }

    async findOne(where: Partial<T>): Promise<T | null> {
        const ir = {
            collection: this.metadata.collection,
            type: 'findOne' as const,
            where: this.toWhereClauses(where),
        };
        return this.driver.findOne(this.metadata.collection, ir);
    }

    async insert(data: Partial<T>): Promise<T> {
        return this.driver.insert(this.metadata.collection, data as Record<string, any>);
    }

    async update(where: Partial<T>, data: Partial<T>): Promise<number> {
        const ir = {
            collection: this.metadata.collection,
            type: 'update' as const,
            where: this.toWhereClauses(where),
        };
        return this.driver.update(this.metadata.collection, ir, data as Record<string, any>);
    }

    async delete(where: Partial<T>): Promise<number> {
        const ir = {
            collection: this.metadata.collection,
            type: 'delete' as const,
            where: this.toWhereClauses(where),
        };
        return this.driver.delete(this.metadata.collection, ir);
    }

    async count(where?: Partial<T>): Promise<number> {
        const ir = {
            collection: this.metadata.collection,
            type: 'count' as const,
            where: where ? this.toWhereClauses(where) : [],
        };
        return this.driver.count(this.metadata.collection, ir);
    }

    query(): QueryBuilder<T> {
        return new QueryBuilder<T>(this.driver, this.metadata.collection);
    }

    private toWhereClauses(where: Partial<T>): WhereClause[] {
        return Object.entries(where as Record<string, any>).map(([field, value]) => ({
            field,
            operator: 'eq' as Operator,
            value,
            logic: 'and' as const,
        }));
    }
}
