import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDriver } from '../drivers/MemoryDriver.js';
import { QueryIR } from '../types.js';

describe('MemoryDriver', () => {
    let driver: MemoryDriver;

    beforeEach(async () => {
        driver = new MemoryDriver();
        await driver.connect({});
    });

    describe('insert and find', () => {
        it('should insert a document and retrieve it', async () => {
            const doc = await driver.insert('users', { name: 'Alice', age: 30 });
            expect(doc._id).toBe(1);
            expect(doc.name).toBe('Alice');

            const q: QueryIR = { collection: 'users', type: 'find', where: [] };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Alice');
        });

        it('should find with equality filter', async () => {
            await driver.insert('users', { name: 'Alice', age: 30 });
            await driver.insert('users', { name: 'Bob', age: 25 });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [{ field: 'name', operator: 'eq', value: 'Alice', logic: 'and' }],
            };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Alice');
        });
    });

    describe('findOne', () => {
        it('should return null when no match', async () => {
            const q: QueryIR = { collection: 'users', type: 'findOne', where: [] };
            const result = await driver.findOne('users', q);
            expect(result).toBeNull();
        });

        it('should return first match', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });

            const q: QueryIR = { collection: 'users', type: 'findOne', where: [] };
            const result = await driver.findOne('users', q);
            expect(result.name).toBe('Alice');
        });
    });

    describe('update', () => {
        it('should update matching documents', async () => {
            await driver.insert('users', { name: 'Alice', age: 30 });
            await driver.insert('users', { name: 'Bob', age: 30 });

            const q: QueryIR = {
                collection: 'users',
                type: 'update',
                where: [{ field: 'age', operator: 'eq', value: 30, logic: 'and' }],
            };
            const count = await driver.update('users', q, { age: 31 });
            expect(count).toBe(2);

            const qFind: QueryIR = { collection: 'users', type: 'find', where: [] };
            const results = await driver.find('users', qFind);
            expect(results[0].age).toBe(31);
            expect(results[1].age).toBe(31);
        });
    });

    describe('delete', () => {
        it('should delete matching documents', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });

            const q: QueryIR = {
                collection: 'users',
                type: 'delete',
                where: [{ field: 'name', operator: 'eq', value: 'Alice', logic: 'and' }],
            };
            const count = await driver.delete('users', q);
            expect(count).toBe(1);

            const qFind: QueryIR = { collection: 'users', type: 'find', where: [] };
            const results = await driver.find('users', qFind);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bob');
        });
    });

    describe('count', () => {
        it('should count documents', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });

            const q: QueryIR = { collection: 'users', type: 'count', where: [] };
            const c = await driver.count('users', q);
            expect(c).toBe(2);
        });
    });

    describe('query operators', () => {
        it('should filter with gt', async () => {
            await driver.insert('items', { price: 10 });
            await driver.insert('items', { price: 20 });
            await driver.insert('items', { price: 30 });

            const q: QueryIR = {
                collection: 'items',
                type: 'find',
                where: [{ field: 'price', operator: 'gt', value: 15, logic: 'and' }],
            };
            const results = await driver.find('items', q);
            expect(results).toHaveLength(2);
        });

        it('should filter with gte and lte', async () => {
            await driver.insert('items', { price: 10 });
            await driver.insert('items', { price: 20 });
            await driver.insert('items', { price: 30 });

            const q: QueryIR = {
                collection: 'items',
                type: 'find',
                where: [
                    { field: 'price', operator: 'gte', value: 10, logic: 'and' },
                    { field: 'price', operator: 'lte', value: 20, logic: 'and' },
                ],
            };
            const results = await driver.find('items', q);
            expect(results).toHaveLength(2);
        });

        it('should filter with in', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });
            await driver.insert('users', { name: 'Charlie' });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [{ field: 'name', operator: 'in', value: ['Alice', 'Bob'], logic: 'and' }],
            };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(2);
        });

        it('should filter with neq', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [{ field: 'name', operator: 'neq', value: 'Alice', logic: 'and' }],
            };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Bob');
        });

        it('should filter with like', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });
            await driver.insert('users', { name: 'Alicia' });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [{ field: 'name', operator: 'like', value: 'Ali', logic: 'and' }],
            };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(2);
        });

        it('should filter with between', async () => {
            await driver.insert('items', { price: 5 });
            await driver.insert('items', { price: 15 });
            await driver.insert('items', { price: 25 });

            const q: QueryIR = {
                collection: 'items',
                type: 'find',
                where: [{ field: 'price', operator: 'between', value: [10, 20], logic: 'and' }],
            };
            const results = await driver.find('items', q);
            expect(results).toHaveLength(1);
        });
    });

    describe('sort, limit, offset, select', () => {
        it('should sort results', async () => {
            await driver.insert('users', { name: 'Charlie', age: 30 });
            await driver.insert('users', { name: 'Alice', age: 25 });
            await driver.insert('users', { name: 'Bob', age: 35 });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [],
                sort: [{ field: 'name', dir: 'asc' }],
            };
            const results = await driver.find('users', q);
            expect(results[0].name).toBe('Alice');
            expect(results[1].name).toBe('Bob');
            expect(results[2].name).toBe('Charlie');
        });

        it('should limit results', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });
            await driver.insert('users', { name: 'Charlie' });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [],
                limit: 2,
            };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(2);
        });

        it('should offset results', async () => {
            await driver.insert('users', { name: 'Alice' });
            await driver.insert('users', { name: 'Bob' });
            await driver.insert('users', { name: 'Charlie' });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [],
                sort: [{ field: '_id', dir: 'asc' }],
                offset: 1,
            };
            const results = await driver.find('users', q);
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Bob');
        });

        it('should select specific fields', async () => {
            await driver.insert('users', { name: 'Alice', age: 30, email: 'a@test.com' });

            const q: QueryIR = {
                collection: 'users',
                type: 'find',
                where: [],
                select: ['name', 'age'],
            };
            const results = await driver.find('users', q);
            expect(results[0]).toHaveProperty('name');
            expect(results[0]).toHaveProperty('age');
            expect(results[0]).not.toHaveProperty('email');
        });
    });

    describe('ensureSchema and dropCollection', () => {
        it('should ensure schema creates collection', async () => {
            await driver.ensureSchema({
                name: 'Products',
                collection: 'products',
                fields: [
                    { name: 'name', type: 'string', primary: true, unique: true, nullable: false, propertyKey: 'name' },
                ],
                relations: [],
                target: null,
            });

            const q: QueryIR = { collection: 'products', type: 'find', where: [] };
            const results = await driver.find('products', q);
            expect(results).toEqual([]);
        });

        it('should drop collection', async () => {
            await driver.insert('temp', { data: 'x' });
            await driver.dropCollection('temp');

            const q: QueryIR = { collection: 'temp', type: 'find', where: [] };
            const results = await driver.find('temp', q);
            expect(results).toEqual([]);
        });
    });
});
