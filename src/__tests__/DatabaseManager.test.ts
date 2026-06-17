import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../DatabaseManager.js';
import { Collection, Field, HasMany } from '../decorators/index.js';
import { DatabaseConfig } from '../types.js';

@Collection({ name: 'guilds' })
class Guild {
    @Field({ type: 'string', primary: true, unique: true })
    guild_id: string;

    @Field({ type: 'string', default: 'en' })
    lang: string;

    @Field({ type: 'string', default: 'z-' })
    prefix: string;

    @Field({ type: 'string', nullable: true })
    description: string | null;
}

@Collection({ name: 'members' })
class Member {
    @Field({ type: 'string', primary: true })
    id: string;

    @Field({ type: 'string' })
    name: string;

    @Field({ type: 'string' })
    guild_id: string;
}

describe('DatabaseManager', () => {
    let db: DatabaseManager;
    const config: DatabaseConfig = {
        default: 'memory',
        drivers: {
            memory: {},
        },
        models: [Guild, Member],
    };

    beforeEach(async () => {
        db = new DatabaseManager();
        await db.connect(config);
        await db.ensureSchemas();
    });

    afterEach(async () => {
        await db.disconnect();
    });

    it('should connect and initialize models', async () => {
        expect(db.getDriver()).toBeDefined();
    });

    it('should register models and provide repositories', () => {
        const guildRepo = db.getRepository(Guild);
        expect(guildRepo).toBeDefined();
        expect(guildRepo.collection).toBe('guilds');

        const memberRepo = db.getRepository(Member);
        expect(memberRepo.collection).toBe('members');
    });

    it('should return same repository instance for same model', () => {
        const repo1 = db.getRepository(Guild);
        const repo2 = db.getRepository(Guild);
        expect(repo1).toBe(repo2);
    });

    it('should perform CRUD through repository', async () => {
        const guilds = db.getRepository(Guild);

        await guilds.insert({ guild_id: '123', lang: 'es', prefix: '!' });
        await guilds.insert({ guild_id: '456', lang: 'en', prefix: '?' });

        const all = await guilds.find();
        expect(all).toHaveLength(2);

        const result = await guilds.findOne({ guild_id: '123' });
        expect(result).toBeDefined();
        expect(result!.lang).toBe('es');

        await guilds.update({ guild_id: '123' }, { lang: 'fr' });
        const updated = await guilds.findOne({ guild_id: '123' });
        expect(updated!.lang).toBe('fr');
    });

    it('should drop collections', async () => {
        const members = db.getRepository(Member);
        await members.insert({ id: '1', name: 'Test', guild_id: '123' });

        await db.dropCollection('members');
        const results = await members.find();
        expect(results).toEqual([]);
    });

    it('should throw on transaction for unsupported driver', async () => {
        await expect(db.transaction(async () => {})).rejects.toThrow(
            'Transactions are not supported by this driver'
        );
    });

    it('should lazily register model when getRepository called for unregistered model', () => {
        @Collection({ name: 'settings' })
        class Settings {
            @Field({ type: 'string' })
            key: string;
        }

        const repo = db.getRepository(Settings);
        expect(repo.collection).toBe('settings');
    });
});
