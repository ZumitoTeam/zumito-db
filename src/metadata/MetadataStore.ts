import 'reflect-metadata';
import { ModelMetadata, FieldMetadata, RelationMetadata } from '../types.js';

const MODEL_METADATA_KEY = Symbol('zumito-db:model');
const FIELD_METADATA_KEY = Symbol('zumito-db:fields');
const RELATION_METADATA_KEY = Symbol('zumito-db:relations');

export class MetadataStore {
    static getModelMetadata(target: any): ModelMetadata | undefined {
        return Reflect.getOwnMetadata(MODEL_METADATA_KEY, target);
    }

    static setModelMetadata(target: any, metadata: ModelMetadata): void {
        Reflect.defineMetadata(MODEL_METADATA_KEY, metadata, target);
    }

    static getFieldMetadata(target: any): FieldMetadata[] {
        return Reflect.getOwnMetadata(FIELD_METADATA_KEY, target) || [];
    }

    static addFieldMetadata(target: any, field: FieldMetadata): void {
        const fields = MetadataStore.getFieldMetadata(target);
        fields.push(field);
        Reflect.defineMetadata(FIELD_METADATA_KEY, fields, target);
    }

    static getRelationMetadata(target: any): RelationMetadata[] {
        return Reflect.getOwnMetadata(RELATION_METADATA_KEY, target) || [];
    }

    static addRelationMetadata(target: any, relation: RelationMetadata): void {
        const relations = MetadataStore.getRelationMetadata(target);
        relations.push(relation);
        Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
    }
}
