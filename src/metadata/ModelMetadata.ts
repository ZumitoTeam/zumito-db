import { ModelMetadata, FieldMetadata, RelationMetadata, FieldType } from '../types.js';
import { MetadataStore } from './MetadataStore.js';

export function buildModelMetadata(target: any): ModelMetadata {
    const fields = MetadataStore.getFieldMetadata(target);
    const relations = MetadataStore.getRelationMetadata(target);
    const existing = MetadataStore.getModelMetadata(target);

    const metadata: ModelMetadata = {
        name: target.name,
        collection: existing?.collection || target.name.toLowerCase(),
        fields,
        relations,
        target,
    };

    MetadataStore.setModelMetadata(target, metadata);
    return metadata;
}

export function getModelMetadata(target: any): ModelMetadata | undefined {
    const meta = MetadataStore.getModelMetadata(target);
    if (!meta) return undefined;

    // Always merge latest field/relation metadata
    const fields = MetadataStore.getFieldMetadata(target);
    const relations = MetadataStore.getRelationMetadata(target);
    
    if (fields.length > 0) meta.fields = fields;
    if (relations.length > 0) meta.relations = relations;

    return meta;
}

export function resolveFieldType(designType: any): FieldType {
    if (designType === String) return 'string';
    if (designType === Number) return 'number';
    if (designType === Boolean) return 'boolean';
    if (designType === Date) return 'date';
    if (designType === Array) return 'array';
    if (designType === Object) return 'object';
    return 'any';
}
