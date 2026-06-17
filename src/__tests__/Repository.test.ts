import { describe, it, expect, beforeEach } from 'vitest';
import { Repository } from '../Repository.js';
import { MemoryDriver } from '../drivers/MemoryDriver.js';
import { Collection, Field } from '../decorators/index.js';
import { buildModelMetadata } from '../metadata/ModelMetadata.js';

@Collection({ name: 'users' })
class User {
    @Field({ type: 'string', primary: true })
    id: string;

    @Field({ type: 'string' })
    name: string;

    @Field({ type: 'number', default: 0 })
    age: number;
}

@Collection({ name: 'products' })
class Product {
    @Field({ type: 'string' })
    name: string;

    @Field({ type: 'number' })
    price: number;
}

describe('Repository', () => {
    let driver: MemoryDriver;
    let userRepo: Repository<User>;
    let productRepo: Repository<Product>;

    beforeEach(async () => {
        driver = new MemoryDriver();
        await driver.connect({});
        const userMeta = buildModelMetadata(User);
        const productMeta = buildModelMetadata(Product);
        await driver.ensureSchema(userMeta);
        await driver.ensureSchema(productMeta);
        userRepo = new Repository<User>(driver, userMeta);
        productRepo = new Repository<Product>(driver, productMeta);
    });

    describe('insert and find', () => {
        it('should insert and find all documents', async () => {
            await userRepo.insert({ id: '1', name: 'Alice' });
            await userRepo.insert({ id: '2', name: 'Bob' });

            const users = await userRepo.find();
            expect(users).toHaveLength(2);
        });

        it('should insert and findOne by criteria', async () => {
            await userRepo.insert({ id: '1', name: 'Alice' });
            await userRepo.insert({ id: '2', name: 'Bob' });

            const user = await userRepo.findOne({ id: '1' });
            expect(user).toBeDefined();
            expect(user!.name).toBe('Alice');
        });
    });

    describe('update', () => {
        it('should update matching documents', async () => {
            await userRepo.insert({ id: '1', name: 'Alice', age: 30 });
            await userRepo.insert({ id: '2', name: 'Bob', age: 30 });

            const count = await userRepo.update({ age: 30 }, { age: 31 });
            expect(count).toBe(2);

            const users = await userRepo.find({ age: 31 });
            expect(users).toHaveLength(2);
        });
    });

    describe('delete', () => {
        it('should delete matching documents', async () => {
            await userRepo.insert({ id: '1', name: 'Alice' });
            await userRepo.insert({ id: '2', name: 'Bob' });

            const count = await userRepo.delete({ id: '1' });
            expect(count).toBe(1);

            const users = await userRepo.find();
            expect(users).toHaveLength(1);
            expect(users[0].id).toBe('2');
        });
    });

    describe('count', () => {
        it('should count all documents', async () => {
            await userRepo.insert({ id: '1', name: 'Alice' });
            await userRepo.insert({ id: '2', name: 'Bob' });

            const c = await userRepo.count();
            expect(c).toBe(2);
        });

        it('should count with filter', async () => {
            await userRepo.insert({ id: '1', name: 'Alice', age: 30 });
            await userRepo.insert({ id: '2', name: 'Bob', age: 25 });

            const c = await userRepo.count({ age: 30 });
            expect(c).toBe(1);
        });
    });

    describe('query builder', () => {
        it('should provide fluent query API', async () => {
            await userRepo.insert({ id: '1', name: 'Alice', age: 30 });
            await userRepo.insert({ id: '2', name: 'Bob', age: 25 });
            await userRepo.insert({ id: '3', name: 'Charlie', age: 35 });

            const results = await userRepo
                .query()
                .where('age', 'gt', 28)
                .sort('name', 'asc')
                .exec();

            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Alice');
        });
    });
});
