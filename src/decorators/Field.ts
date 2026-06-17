import 'reflect-metadata';
import { FieldType } from '../types.js';
import { MetadataStore } from '../metadata/MetadataStore.js';
import { resolveFieldType } from '../metadata/ModelMetadata.js';

export interface FieldOptions {
    type?: FieldType;
    primary?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: any;
}

export function Field(options: FieldOptions = {}): PropertyDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        const designType = Reflect.getMetadata('design:type', target, propertyKey);
        const resolvedType = options.type || resolveFieldType(designType);

        if (!options.type && !designType) {
            throw new Error(
                `Could not determine type for field "${String(propertyKey)}" on "${target.constructor.name}". ` +
                `Please specify 'type' explicitly in @Field({ type: 'string' }) or ensure emitDecoratorMetadata is enabled.`
            );
        }

        MetadataStore.addFieldMetadata(target.constructor, {
            name: propertyKey as string,
            type: resolvedType,
            primary: options.primary || false,
            unique: options.unique || false,
            nullable: options.nullable ?? true,
            default: options.default,
            propertyKey: propertyKey as string,
        });
    };
}
