import { QueryIR, WhereClause } from '../types.js';
import { toSqlOperator } from '../operators.js';

export class SqlCompiler {
    compileSelect(ir: QueryIR): { sql: string; params: any[] } {
        const params: any[] = [];
        const fields = ir.select && ir.select.length > 0 ? ir.select.join(', ') : '*';
        const table = ir.collection;
        const where = this.compileWhere(ir.where, params);
        const order = this.compileOrder(ir.sort);
        const limit = ir.limit ? `LIMIT ${ir.limit}` : '';
        const offset = ir.offset ? `OFFSET ${ir.offset}` : '';

        let sql = `SELECT ${fields} FROM ${table}`;
        if (where) sql += ` WHERE ${where.sql}`;
        if (order) sql += ` ORDER BY ${order}`;
        if (limit) sql += ` ${limit}`;
        if (offset) sql += ` ${offset}`;

        return { sql, params: where ? where.params.concat(params) : params };
    }

    compileInsert(collection: string, data: Record<string, any>): { sql: string; params: any[] } {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(', ');
        const params = keys.map(k => data[k]);
        const sql = `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders})`;
        return { sql, params };
    }

    compileUpdate(collection: string, data: Record<string, any>, ir: QueryIR): { sql: string; params: any[] } {
        const params: any[] = [];
        const setClauses = Object.keys(data).map(k => {
            params.push(data[k]);
            return `${k} = ?`;
        }).join(', ');
        const where = this.compileWhere(ir.where, params);
        let sql = `UPDATE ${collection} SET ${setClauses}`;
        if (where) {
            sql += ` WHERE ${where.sql}`;
            params.push(...where.params);
        }
        return { sql, params };
    }

    compileDelete(collection: string, ir: QueryIR): { sql: string; params: any[] } {
        const params: any[] = [];
        const where = this.compileWhere(ir.where, params);
        let sql = `DELETE FROM ${collection}`;
        if (where) {
            sql += ` WHERE ${where.sql}`;
            params.push(...where.params);
        }
        return { sql, params };
    }

    compileCount(collection: string, ir: QueryIR): { sql: string; params: any[] } {
        const params: any[] = [];
        const where = this.compileWhere(ir.where, params);
        let sql = `SELECT COUNT(*) as count FROM ${collection}`;
        if (where) {
            sql += ` WHERE ${where.sql}`;
            params.push(...where.params);
        }
        return { sql, params };
    }

    compileCreateTable(collection: string, fields: { name: string; type: string; primary: boolean; nullable: boolean; unique: boolean }[]): string {
        const cols = fields.map(f => {
            let col = `${f.name} ${this.mapType(f.type)}`;
            if (f.primary) col += ' PRIMARY KEY';
            if (!f.nullable) col += ' NOT NULL';
            if (f.unique) col += ' UNIQUE';
            return col;
        });
        return `CREATE TABLE IF NOT EXISTS ${collection} (${cols.join(', ')})`;
    }

    private compileWhere(clauses: WhereClause[], params: any[]): { sql: string; params: any[] } | null {
        if (!clauses || clauses.length === 0) return null;

        const localParams: any[] = [];
        const parts: string[] = [];

        for (const clause of clauses) {
            const logic = parts.length > 0 ? ` ${clause.logic.toUpperCase()} ` : '';
            if (clause.operator === 'in' || clause.operator === 'nin') {
                const placeholders = (clause.value as any[]).map(() => '?').join(', ');
                parts.push(`${logic}${clause.field} ${toSqlOperator(clause.operator)} (${placeholders})`);
                localParams.push(...clause.value);
            } else if (clause.operator === 'between') {
                parts.push(`${logic}${clause.field} BETWEEN ? AND ?`);
                localParams.push(clause.value[0], clause.value[1]);
            } else {
                parts.push(`${logic}${clause.field} ${toSqlOperator(clause.operator)} ?`);
                localParams.push(clause.value);
            }
        }

        return { sql: parts.join(''), params: localParams };
    }

    private compileOrder(sort: { field: string; dir: string }[] | undefined): string {
        if (!sort || sort.length === 0) return '';
        return sort.map(s => `${s.field} ${s.dir.toUpperCase()}`).join(', ');
    }

    private mapType(type: string): string {
        const mapping: Record<string, string> = {
            string: 'TEXT',
            number: 'REAL',
            boolean: 'INTEGER',
            date: 'TEXT',
            object: 'TEXT',
            array: 'TEXT',
            any: 'TEXT',
        };
        return mapping[type] || 'TEXT';
    }
}
