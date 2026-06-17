import 'reflect-metadata';
import { MetadataStore } from '../metadata/MetadataStore.js';
import { buildModelMetadata } from '../metadata/ModelMetadata.js';

export interface CollectionOptions {
    name: string;
}

export function Collection(options: CollectionOptions): ClassDecorator {
    return function (target: any) {
        const existing = MetadataStore.getModelMetadata(target);
        if (existing) {
            existing.collection = options.name;
            return;
        }

        MetadataStore.setModelMetadata(target, {
            name: target.name,
            collection: options.name,
            fields: [],
            relations: [],
            target,
        });
    };
}
