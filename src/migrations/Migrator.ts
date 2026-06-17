import { DatabaseManager } from '../DatabaseManager.js';
import { Migration } from './Migration.js';
import { MigrationRunner } from './MigrationRunner.js';

export class Migrator {
    private db: DatabaseManager;
    private runner: MigrationRunner;

    constructor(db: DatabaseManager, runner: MigrationRunner) {
        this.db = db;
        this.runner = runner;
    }

    async latest(migrations: Migration[]): Promise<string[]> {
        const executed = await this.runner.getExecuted();
        const pending = migrations.filter(m => !executed.includes(m.name));
        const applied: string[] = [];

        for (const migration of pending) {
            await this.runner.runUp(migration);
            applied.push(migration.name);
        }

        return applied;
    }

    async rollback(migrations: Migration[]): Promise<string[]> {
        const executed = await this.runner.getExecuted();
        // Roll back the last executed migration
        const toRollback = migrations
            .filter(m => executed.includes(m.name))
            .reverse();

        const rolled: string[] = [];
        if (toRollback.length > 0) {
            await this.runner.runDown(toRollback[0]);
            rolled.push(toRollback[0].name);
        }

        return rolled;
    }

    async status(migrations: Migration[]): Promise<{ name: string; executed: boolean }[]> {
        const executed = await this.runner.getExecuted();
        return migrations.map(m => ({
            name: m.name,
            executed: executed.includes(m.name),
        }));
    }

    async list(migrations: Migration[]): Promise<Migration[]> {
        return migrations;
    }
}
