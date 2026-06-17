export { DatabaseManager } from './DatabaseManager.js';
export { Repository } from './Repository.js';
export { QueryBuilder } from './QueryBuilder.js';
export { Migration } from './migrations/Migration.js';
export { Migrator } from './migrations/Migrator.js';

export { Collection } from './decorators/Collection.js';
export { Field } from './decorators/Field.js';
export { HasMany, BelongsTo, HasOne } from './decorators/Relation.js';

export { getModelMetadata, buildModelMetadata } from './metadata/ModelMetadata.js';
export { MetadataStore } from './metadata/MetadataStore.js';

export type { CollectionOptions } from './decorators/Collection.js';
export type { FieldOptions } from './decorators/Field.js';
export type { HasManyOptions, BelongsToOptions, HasOneOptions } from './decorators/Relation.js';

export type {
    FieldType,
    Operator,
    WhereClause,
    SortClause,
    QueryIR,
    FieldMetadata,
    RelationMetadata,
    ModelMetadata,
    DriverConfig,
    DatabaseConfig,
} from './types.js';

export type { DatabaseDriver } from './drivers/DriverInterface.js';
export { MemoryDriver } from './drivers/MemoryDriver.js';
