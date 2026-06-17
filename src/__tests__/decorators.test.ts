import { describe, it, expect } from 'vitest';
import { Collection, Field, HasMany, BelongsTo, HasOne } from '../decorators/index.js';
import { getModelMetadata, buildModelMetadata } from '../metadata/ModelMetadata.js';

describe('Decorators', () => {
    describe('@Collection', () => {
        it('should set collection name in metadata', () => {
            @Collection({ name: 'custom_guilds' })
            class Guild {}

            const meta = getModelMetadata(Guild);
            expect(meta).toBeDefined();
            expect(meta!.collection).toBe('custom_guilds');
            expect(meta!.name).toBe('Guild');
        });
    });

    describe('@Field', () => {
        it('should register field metadata with explicit types', () => {
            @Collection({ name: 'users' })
            class User {
                @Field({ type: 'string', primary: true })
                id: string;

                @Field({ type: 'string', default: 'unknown' })
                name: string;

                @Field({ type: 'string', unique: true, nullable: true })
                email: string;
            }

            const meta = buildModelMetadata(User);
            expect(meta.fields).toHaveLength(3);

            const idField = meta.fields.find(f => f.propertyKey === 'id')!;
            expect(idField.primary).toBe(true);
            expect(idField.type).toBe('string');

            const nameField = meta.fields.find(f => f.propertyKey === 'name')!;
            expect(nameField.default).toBe('unknown');

            const emailField = meta.fields.find(f => f.propertyKey === 'email')!;
            expect(emailField.unique).toBe(true);
            expect(emailField.nullable).toBe(true);
        });

        it('should throw if type cannot be inferred', () => {
            expect(() => {
                @Collection({ name: 'bad' })
                class Bad {
                    @Field()
                    name: string;
                }
                buildModelMetadata(Bad);
            }).toThrow(/Could not determine type/);
        });
    });

    describe('@HasMany', () => {
        it('should register hasMany relation', () => {
            @Collection({ name: 'posts' })
            class Post {
                @Field({ type: 'string' })
                title: string;
            }

            @Collection({ name: 'users' })
            class User {
                @Field({ type: 'string' })
                id: string;

                @HasMany(() => Post, { foreignKey: 'userId' })
                posts: Post[];
            }

            const userMeta = buildModelMetadata(User);
            expect(userMeta.relations).toHaveLength(1);
            expect(userMeta.relations[0].type).toBe('hasMany');
            expect(userMeta.relations[0].foreignKey).toBe('userId');
            expect(userMeta.relations[0].propertyKey).toBe('posts');
        });
    });

    describe('@BelongsTo', () => {
        it('should register belongsTo relation', () => {
            @Collection({ name: 'users' })
            class User {
                @Field({ type: 'string' })
                id: string;
            }

            @Collection({ name: 'posts' })
            class Post {
                @Field({ type: 'string' })
                id: string;

                @BelongsTo(() => User, { foreignKey: 'userId' })
                author: User;
            }

            const postMeta = buildModelMetadata(Post);
            expect(postMeta.relations).toHaveLength(1);
            expect(postMeta.relations[0].type).toBe('belongsTo');
            expect(postMeta.relations[0].foreignKey).toBe('userId');
        });
    });

    describe('@HasOne', () => {
        it('should register hasOne relation', () => {
            @Collection({ name: 'profiles' })
            class Profile {
                @Field({ type: 'string' })
                id: string;
            }

            @Collection({ name: 'users' })
            class User {
                @Field({ type: 'string' })
                id: string;

                @HasOne(() => Profile, { foreignKey: 'userId' })
                profile: Profile;
            }

            const userMeta = buildModelMetadata(User);
            expect(userMeta.relations).toHaveLength(1);
            expect(userMeta.relations[0].type).toBe('hasOne');
        });
    });
});
