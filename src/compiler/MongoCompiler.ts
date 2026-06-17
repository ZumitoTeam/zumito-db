import { QueryIR, WhereClause } from '../types.js';
import { toMongoOperator } from '../operators.js';

export class MongoCompiler {
    compileFind(ir: QueryIR): { filter: Record<string, any>; options: Record<string, any> } {
        const filter = this.compileWhere(ir.where);
        const options: Record<string, any> = {};

        if (ir.select && ir.select.length > 0) {
            const projection: Record<string, number> = {};
            for (const field of ir.select) projection[field] = 1;
            options.projection = projection;
        }
        if (ir.sort && ir.sort.length > 0) {
            const sort: Record<string, number> = {};
            for (const s of ir.sort) sort[s.field] = s.dir === 'asc' ? 1 : -1;
            options.sort = sort;
        }
        if (ir.limit) options.limit = ir.limit;
        if (ir.offset) options.skip = ir.offset;

        return { filter, options };
    }

    compileUpdate(data: Record<string, any>): Record<string, any> {
        return { $set: data };
    }

    private compileWhere(clauses: WhereClause[]): Record<string, any> {
        if (!clauses || clauses.length === 0) return {};

        // Group by logic: split 'or' groups
        const groups: WhereClause[][] = [];
        let currentGroup: WhereClause[] = [];

        for (const clause of clauses) {
            currentGroup.push(clause);
            if (clause.logic === 'or') {
                groups.push(currentGroup);
                currentGroup = [];
            }
        }
        if (currentGroup.length > 0) groups.push(currentGroup);

        if (groups.length === 1) {
            const filter: Record<string, any> = {};
            for (const clause of groups[0]) {
                filter[clause.field] = this.compileClause(clause);
            }
            return filter;
        }

        return {
            $or: groups.map(group => {
                const filter: Record<string, any> = {};
                for (const clause of group) {
                    filter[clause.field] = this.compileClause(clause);
                }
                return filter;
            }),
        };
    }

    private compileClause(clause: WhereClause): any {
        if (clause.operator === 'eq') return clause.value;
        if (clause.operator === 'like') return { $regex: clause.value, $options: 'i' };
        if (clause.operator === 'between') return { $gte: clause.value[0], $lte: clause.value[1] };
        return { [toMongoOperator(clause.operator)]: clause.value };
    }
}
