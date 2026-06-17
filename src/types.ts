export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'any';

export type Operator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between';

export interface WhereClause {
    field: string;
    operator: Operator;
    value: any;
    logic: 'and' | 'or';
}

export interface SortClause {
    field: string;
    dir: 'asc' | 'desc';
}

export interface QueryIR {
    collection: string;
    type: 'find' | 'findOne' | 'insert' | 'update' | 'delete' | 'count';
    where: WhereClause[];
    select?: string[];
    sort?: SortClause[];
    limit?: number;
    offset?: number;
    data?: Record<string, any>;
    populate?: string[];
}

export interface FieldMetadata {
    name: string;
    type: FieldType;
    primary: boolean;
    unique: boolean;
    nullable: boolean;
    default?: any;
    propertyKey: string;
}

export interface RelationMetadata {
    propertyKey: string;
    target: () => any;
    type: 'hasMany' | 'belongsTo' | 'hasOne';
    foreignKey: string;
}

export interface ModelMetadata {
    name: string;
    collection: string;
    fields: FieldMetadata[];
    relations: RelationMetadata[];
    target: any;
}

export interface DriverConfig {
    [key: string]: any;
}

export interface DatabaseConfig {
    default: string;
    drivers: Record<string, DriverConfig>;
    models?: any[];
    migrations?: any[];
}
