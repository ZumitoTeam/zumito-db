import 'reflect-metadata';
import { MetadataStore } from '../metadata/MetadataStore.js';

export interface HasManyOptions {
    foreignKey: string;
}

export function HasMany(targetFn: () => any, options: HasManyOptions): PropertyDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        MetadataStore.addRelationMetadata(target.constructor, {
            propertyKey: propertyKey as string,
            target: targetFn,
            type: 'hasMany',
            foreignKey: options.foreignKey,
        });
    };
}

export interface BelongsToOptions {
    foreignKey: string;
}

export function BelongsTo(targetFn: () => any, options: BelongsToOptions): PropertyDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        MetadataStore.addRelationMetadata(target.constructor, {
            propertyKey: propertyKey as string,
            target: targetFn,
            type: 'belongsTo',
            foreignKey: options.foreignKey,
        });
    };
}

export interface HasOneOptions {
    foreignKey: string;
}

export function HasOne(targetFn: () => any, options: HasOneOptions): PropertyDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        MetadataStore.addRelationMetadata(target.constructor, {
            propertyKey: propertyKey as string,
            target: targetFn,
            type: 'hasOne',
            foreignKey: options.foreignKey,
        });
    };
}
