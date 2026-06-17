import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../DatabaseManager.js';
import { Migration } from '../migrations/Migration.js';
import { MigrationRunner } from '../migrations/MigrationRunner.js';
import { Migrator } from '../migrations/Migrator.js';
import { DatabaseConfig } from '../types.js';

class CreateUsersTable extends Migration {
    name = '20240101_create_users';

    async up(db: DatabaseManager) {
        await db.getDriver().insert('users', { name: 'system', created: '2024-01-01' });
    }

    async down(db: DatabaseManager) {
        await db.dropCollection('users');
    }
}

class AddRolesTable extends Migration {
    name = '20240102_add_roles';

    async up(db: DatabaseManager) {
        await db.getDriver().insert('roles', { name: 'admin', level: 1 });
    }
}

describe('Migration system', () => {
    let db: DatabaseManager;
    const config: DatabaseConfig = {
        default: 'memory',
        drivers: { memory: {} },
    };

    beforeEach(async () => {
        db = new DatabaseManager();
        await db.connect(config);
    });

    afterEach(async () => {
        await db.disconnect();
    });

    describe('MigrationRunner', () => {
        it('should run up migration and track it', async () => {
            const runner = new MigrationRunner(db);
            const migration = new CreateUsersTable();

            await runner.runUp(migration);

            const executed = await runner.getExecuted();
            expect(executed).toContain('20240101_create_users');
        });

        it('should run down migration and remove tracking', async () => {
            const runner = new MigrationRunner(db);
            const migration = new CreateUsersTable();

            await runner.runUp(migration);
            await runner.runDown(migration);

            const executed = await runner.getExecuted();
            expect(executed).not.toContain('20240101_create_users');
        });
    });

    describe('Migrator', () => {
        it('should run pending migrations with latest()', async () => {
            const migrator = db.migrator;
            const migrations = [new CreateUsersTable(), new AddRolesTable()];

            const applied = await migrator.latest(migrations);
            expect(applied).toHaveLength(2);
            expect(applied).toContain('20240101_create_users');
            expect(applied).toContain('20240102_add_roles');
        });

        it('should skip already executed migrations', async () => {
            const migrator = db.migrator;
            const migrations = [new CreateUsersTable(), new AddRolesTable()];

            await migrator.latest([new CreateUsersTable()]);
            const applied = await migrator.latest(migrations);
            expect(applied).toHaveLength(1);
            expect(applied).toContain('20240102_add_roles');
        });

        it('should rollback last migration', async () => {
            const migrator = db.migrator;
            const migrations = [new CreateUsersTable(), new AddRolesTable()];

            await migrator.latest(migrations);
            const rolled = await migrator.rollback(migrations);
            expect(rolled).toHaveLength(1);
            expect(rolled).toContain('20240102_add_roles');
        });

        it('should show migration status', async () => {
            const migrator = db.migrator;
            const migrations = [new CreateUsersTable()];

            await migrator.latest(migrations);
            const status = await migrator.status(migrations);
            expect(status).toHaveLength(1);
            expect(status[0].name).toBe('20240101_create_users');
            expect(status[0].executed).toBe(true);
        });
    });
});
