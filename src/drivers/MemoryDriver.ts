import { DatabaseDriver } from './DriverInterface.js';
import { QueryIR, WhereClause, ModelMetadata, SortClause } from '../types.js';

interface StoredDoc {
    _id: number;
    [key: string]: any;
}

export class MemoryDriver implements DatabaseDriver {
    private collections = new Map<string, StoredDoc[]>();
    private sequences = new Map<string, number>();
    public raw = this;

    async connect(_config: Record<string, any>): Promise<void> {}

    async disconnect(): Promise<void> {
        this.collections.clear();
        this.sequences.clear();
    }

    async find(collection: string, query: QueryIR): Promise<any[]> {
        const docs = this.collections.get(collection) || [];
        let results: StoredDoc[] = this.applyWhere(docs, query.where);

        if (query.sort && query.sort.length > 0) {
            results = this.applySort(results, query.sort);
        }
        if (query.offset !== undefined && query.offset > 0) {
            results = results.slice(query.offset);
        }
        if (query.limit !== undefined && query.limit > 0) {
            results = results.slice(0, query.limit);
        }
        if (query.select && query.select.length > 0) {
            results = results.map(doc => this.applySelect(doc, query.select!));
        }
        return results;
    }

    async findOne(collection: string, query: QueryIR): Promise<any | null> {
        const results = await this.find(collection, { ...query, limit: 1 });
        return results.length > 0 ? results[0] : null;
    }

    async insert(collection: string, data: Record<string, any>): Promise<any> {
        if (!this.collections.has(collection)) {
            this.collections.set(collection, []);
        }
        const seq = this.sequences.get(collection) || 0;
        const nextId = seq + 1;
        this.sequences.set(collection, nextId);

        const doc: StoredDoc = { _id: nextId, ...data };
        this.collections.get(collection)!.push(doc);
        return { ...doc };
    }

    async update(collection: string, query: QueryIR, data: Record<string, any>): Promise<number> {
        const docs = this.collections.get(collection) || [];
        const matches = this.findMatchingIndices(docs, query.where);
        for (const idx of matches) {
            Object.assign(docs[idx], data);
        }
        return matches.length;
    }

    async delete(collection: string, query: QueryIR): Promise<number> {
        const docs = this.collections.get(collection) || [];
        const matches = this.findMatchingIndices(docs, query.where);
        // Remove in reverse order to keep indices valid
        for (let i = matches.length - 1; i >= 0; i--) {
            docs.splice(matches[i], 1);
        }
        return matches.length;
    }

    async count(collection: string, query: QueryIR): Promise<number> {
        const results = await this.find(collection, query);
        return results.length;
    }

    async ensureSchema(_metadata: ModelMetadata): Promise<void> {
        if (!this.collections.has(_metadata.collection)) {
            this.collections.set(_metadata.collection, []);
        }
        // Get next sequence from existing docs
        const docs = this.collections.get(_metadata.collection)!;
        if (docs.length > 0) {
            const maxId = Math.max(...docs.map(d => d._id));
            this.sequences.set(_metadata.collection, maxId);
        }
    }

    async dropCollection(name: string): Promise<void> {
        this.collections.delete(name);
        this.sequences.delete(name);
    }

    private applyWhere(docs: StoredDoc[], where: WhereClause[]): StoredDoc[] {
        if (!where || where.length === 0) return [...docs];

        return docs.filter(doc => {
            if (where.length === 0) return true;

            // Build result starting with first clause
            let result = this.evaluateClause(doc, where[0]);

            // Apply subsequent clauses: logic[i] tells how clause[i] connects to accumulated result
            for (let i = 1; i < where.length; i++) {
                const matches = this.evaluateClause(doc, where[i]);
                if (where[i].logic === 'or') {
                    result = result || matches;
                } else {
                    result = result && matches;
                }
            }
            return result;
        });
    }

    private evaluateClause(doc: StoredDoc, clause: WhereClause): boolean {
        const value = doc[clause.field];
        switch (clause.operator) {
            case 'eq': return value === clause.value;
            case 'neq': return value !== clause.value;
            case 'gt': return value > clause.value;
            case 'gte': return value >= clause.value;
            case 'lt': return value < clause.value;
            case 'lte': return value <= clause.value;
            case 'in': return Array.isArray(clause.value) && clause.value.includes(value);
            case 'nin': return Array.isArray(clause.value) && !clause.value.includes(value);
            case 'like': return typeof value === 'string' && value.includes(String(clause.value));
            case 'between':
                return Array.isArray(clause.value) &&
                    clause.value.length === 2 &&
                    value >= clause.value[0] &&
                    value <= clause.value[1];
            default: return false;
        }
    }

    private findMatchingIndices(docs: StoredDoc[], where: WhereClause[]): number[] {
        const indices: number[] = [];
        for (let i = 0; i < docs.length; i++) {
            let matches = true;
            for (const clause of where) {
                if (!this.evaluateClause(docs[i], clause)) {
                    matches = false;
                    break;
                }
            }
            if (matches) indices.push(i);
        }
        return indices;
    }

    private applySort(docs: StoredDoc[], sort: SortClause[]): StoredDoc[] {
        return [...docs].sort((a, b) => {
            for (const s of sort) {
                const aVal = a[s.field];
                const bVal = b[s.field];
                if (aVal < bVal) return s.dir === 'asc' ? -1 : 1;
                if (aVal > bVal) return s.dir === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    private applySelect(doc: StoredDoc, fields: string[]): StoredDoc {
        const result: StoredDoc = { _id: doc._id };
        for (const field of fields) {
            if (field in doc) {
                result[field] = doc[field];
            }
        }
        return result;
    }
}
