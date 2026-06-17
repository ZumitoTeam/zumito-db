import { DatabaseManager } from '../DatabaseManager.js';

export abstract class Migration {
    abstract name: string;

    abstract up(db: DatabaseManager): Promise<void>;

    async down(_db: DatabaseManager): Promise<void> {
        // Optional: implement in subclass
    }
}
