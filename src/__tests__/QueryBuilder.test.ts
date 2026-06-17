import { describe, it, expect, beforeEach } from 'vitest';
import { QueryBuilder } from '../QueryBuilder.js';
import { MemoryDriver } from '../drivers/MemoryDriver.js';

describe('QueryBuilder', () => {
    let driver: MemoryDriver;
    let qb: QueryBuilder<any>;

    beforeEach(async () => {
        driver = new MemoryDriver();
        await driver.connect({});
        qb = new QueryBuilder(driver, 'users');
    });

    it('should build basic query and execute', async () => {
        await driver.insert('users', { name: 'Alice' });
        await driver.insert('users', { name: 'Bob' });

        const results = await qb.exec();
        expect(results).toHaveLength(2);
    });

    it('should filter with where', async () => {
        await driver.insert('users', { name: 'Alice', age: 30 });
        await driver.insert('users', { name: 'Bob', age: 25 });

        const results = await qb.where('name', 'eq', 'Alice').exec();
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice');
    });

    it('should chain multiple where clauses with AND', async () => {
        await driver.insert('users', { name: 'Alice', age: 30 });
        await driver.insert('users', { name: 'Alice', age: 25 });

        const results = await qb
            .where('name', 'eq', 'Alice')
            .andWhere('age', 'eq', 30)
            .exec();
        expect(results).toHaveLength(1);
    });

    it('should return first result', async () => {
        await driver.insert('users', { name: 'Alice' });
        await driver.insert('users', { name: 'Bob' });

        const result = await qb.sort('_id', 'asc').first();
        expect(result).toBeDefined();
        expect(result!.name).toBe('Alice');
    });

    it('should return null for first on empty set', async () => {
        const result = await qb.first();
        expect(result).toBeNull();
    });

    it('should count results', async () => {
        await driver.insert('users', { name: 'Alice' });
        await driver.insert('users', { name: 'Bob' });
        await driver.insert('users', { name: 'Charlie' });

        const c = await qb.count();
        expect(c).toBe(3);
    });

    it('should sort, limit, and select', async () => {
        await driver.insert('users', { name: 'Charlie', age: 30 });
        await driver.insert('users', { name: 'Alice', age: 25 });
        await driver.insert('users', { name: 'Bob', age: 35 });

        const results = await qb
            .sort('name', 'asc')
            .limit(2)
            .select(['name'])
            .exec();

        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Alice');
        expect(results[0]).not.toHaveProperty('age');
    });

    it('should support orWhere', async () => {
        await driver.insert('users', { name: 'Alice', age: 30 });
        await driver.insert('users', { name: 'Bob', age: 25 });
        await driver.insert('users', { name: 'Charlie', age: 35 });

        const results = await qb
            .where('name', 'eq', 'Alice')
            .orWhere('name', 'eq', 'Bob')
            .exec();
        
        expect(results).toHaveLength(2);
    });

    it('should export to IR', () => {
        const ir = qb.where('name', 'eq', 'Alice').toIR();
        expect(ir.collection).toBe('users');
        expect(ir.where).toHaveLength(1);
        expect(ir.where[0].field).toBe('name');
    });
});
