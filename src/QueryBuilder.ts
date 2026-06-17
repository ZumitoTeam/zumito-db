import { QueryIR, Operator } from './types.js';
import { DatabaseDriver } from './drivers/DriverInterface.js';

export class QueryBuilder<T = any> {
    private ir: QueryIR;
    private driver: DatabaseDriver;

    constructor(driver: DatabaseDriver, collection: string) {
        this.driver = driver;
        this.ir = {
            collection,
            type: 'find',
            where: [],
        };
    }

    where(field: keyof T & string, operator: Operator, value: any): this {
        this.ir.where.push({ field, operator, value, logic: 'and' });
        return this;
    }

    andWhere(field: keyof T & string, operator: Operator, value: any): this {
        this.ir.where.push({ field, operator, value, logic: 'and' });
        return this;
    }

    orWhere(field: keyof T & string, operator: Operator, value: any): this {
        this.ir.where.push({ field, operator, value, logic: 'or' });
        return this;
    }

    select(fields: (keyof T & string)[]): this {
        this.ir.select = fields;
        return this;
    }

    sort(field: keyof T & string, dir: 'asc' | 'desc'): this {
        if (!this.ir.sort) this.ir.sort = [];
        this.ir.sort.push({ field, dir });
        return this;
    }

    limit(n: number): this {
        this.ir.limit = n;
        return this;
    }

    offset(n: number): this {
        this.ir.offset = n;
        return this;
    }

    populate(relation: string): this {
        if (!this.ir.populate) this.ir.populate = [];
        this.ir.populate.push(relation);
        return this;
    }

    async exec(): Promise<T[]> {
        return this.driver.find(this.ir.collection, this.ir);
    }

    async first(): Promise<T | null> {
        const results = await this.driver.find(this.ir.collection, {
            ...this.ir,
            limit: 1,
        });
        return results.length > 0 ? results[0] : null;
    }

    async count(): Promise<number> {
        return this.driver.count(this.ir.collection, this.ir);
    }

    toIR(): QueryIR {
        return { ...this.ir };
    }
}
