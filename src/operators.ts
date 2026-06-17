import { Operator } from './types.js';

const operatorMap: Record<Operator, string> = {
    eq: '=',
    neq: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    in: 'IN',
    nin: 'NOT IN',
    like: 'LIKE',
    between: 'BETWEEN',
};

export function toSqlOperator(op: Operator): string {
    return operatorMap[op] || '=';
}

export function toMongoOperator(op: Operator): string {
    const mongoOps: Record<string, string> = {
        eq: '$eq',
        neq: '$ne',
        gt: '$gt',
        gte: '$gte',
        lt: '$lt',
        lte: '$lte',
        in: '$in',
        nin: '$nin',
        like: '$regex',
    };
    return mongoOps[op] || '$eq';
}
