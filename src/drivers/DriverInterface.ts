import { QueryIR, ModelMetadata } from '../types.js';

export interface DatabaseDriver {
    connect(config: Record<string, any>): Promise<void>;
    disconnect(): Promise<void>;

    find(collection: string, query: QueryIR): Promise<any[]>;
    findOne(collection: string, query: QueryIR): Promise<any | null>;
    insert(collection: string, data: Record<string, any>): Promise<any>;
    update(collection: string, query: QueryIR, data: Record<string, any>): Promise<number>;
    delete(collection: string, query: QueryIR): Promise<number>;
    count(collection: string, query: QueryIR): Promise<number>;

    ensureSchema(metadata: ModelMetadata): Promise<void>;
    dropCollection(name: string): Promise<void>;
    listCollections(): Promise<string[]>;

    transaction?<T>(fn: (trx: any) => Promise<T>): Promise<T>;

    raw: any;
}
