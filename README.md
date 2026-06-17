<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]
[![npm][npm-shield]][npm-url]

<br />
<div align="center">
  <a href="https://github.com/ZumitoTeam/zumito-db">
    <img src="https://media.discordapp.net/attachments/964297459327184906/1066399583896342649/d05ce5c0de25fd9afb4f5492f31f21fe.png" alt="Logo" width="80" height="80"/>
  </a>

  <h3 align="center">Zumito DB</h3>

  <p align="center">
    Multi-driver database abstraction layer with decorator-based models
    <br />
    <a href="https://github.com/ZumitoTeam/zumito-db/issues">Report Bug</a>
    ·
    <a href="https://github.com/ZumitoTeam/zumito-db/issues">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#supported-drivers">Supported Drivers</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

Zumito DB is a lightweight, decorator-based ORM for Node.js. Define your models with TypeScript decorators and switch between database drivers without changing your application code. Supports MongoDB, SQLite, TingoDB, and an in-memory driver for testing.

### Built With

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

### Supported Drivers

| Driver  | Description              |
| ------- | ------------------------ |
| memory  | In-memory (testing/DEV)  |
| mongo   | MongoDB                  |
| sqlite  | SQLite via better-sqlite3|
| tingo   | TingoDB (embedded MongoDB-compatible) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```sh
npm install zumito-db reflect-metadata
```

Depending on your database:

```sh
npm install mongodb        # for MongoDB
npm install better-sqlite3 # for SQLite
npm install tingodb        # for TingoDB
```

Enable decorator metadata in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Import `reflect-metadata` at the entry point of your application:

```ts
import 'reflect-metadata';
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### Define a Model

```ts
import { Collection, Field, HasMany, BelongsTo } from 'zumito-db';

@Collection({ name: 'users' })
class User {
  @Field({ type: 'string', primary: true })
  id: string;

  @Field({ type: 'string', unique: true })
  email: string;

  @Field({ type: 'string' })
  name: string;

  @Field({ type: 'number', default: 0 })
  age: number;

  @HasMany(() => Post, { foreignKey: 'userId' })
  posts: Post[];
}

@Collection({ name: 'posts' })
class Post {
  @Field({ type: 'string', primary: true })
  id: string;

  @Field({ type: 'string' })
  title: string;

  @Field({ type: 'string' })
  userId: string;

  @BelongsTo(() => User, { foreignKey: 'userId' })
  user: User;
}
```

### Connect and Use Repositories

```ts
import { DatabaseManager } from 'zumito-db';

const db = new DatabaseManager();

await db.connect({
  default: 'mongo',
  drivers: {
    mongo: { url: 'mongodb://localhost:27017', database: 'myapp' },
  },
  models: [User, Post],
});

const userRepo = db.getRepository(User);

// Insert
const user = await userRepo.insert({ email: 'test@example.com', name: 'Alice' });

// Find
const users = await userRepo.find({ name: 'Alice' });

// Update
await userRepo.update({ id: user.id }, { age: 30 });

// Delete
await userRepo.delete({ id: user.id });

// Count
const count = await userRepo.count();
```

### Using the Query Builder

```ts
const posts = await db.getRepository(Post)
  .query()
  .where('title', 'like', '%typescript%')
  .sort('createdAt', 'desc')
  .limit(10)
  .offset(0)
  .execute();
```

### Migrations

```ts
import { Migration } from 'zumito-db';

class CreateUsersTable extends Migration {
  async up(): Promise<void> {
    await this.db.ensureSchemas();
  }

  async down(): Promise<void> {
    await this.db.dropCollection('users');
  }
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

See the [open issues](https://github.com/ZumitoTeam/zumito-db/issues) for a full list of proposed features.

- [ ] PostgreSQL support
- [ ] MySQL support
- [ ] Redis support
- [ ] Schema sync / auto-migration
- [ ] Hooks / lifecycle events

## Contributing

Contributions are what make the open source community amazing. Any contributions are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the ISC License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/ZumitoTeam/zumito-db.svg?style=for-the-badge
[contributors-url]: https://github.com/ZumitoTeam/zumito-db/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ZumitoTeam/zumito-db.svg?style=for-the-badge
[forks-url]: https://github.com/ZumitoTeam/zumito-db/network/members
[stars-shield]: https://img.shields.io/github/stars/ZumitoTeam/zumito-db.svg?style=for-the-badge
[stars-url]: https://github.com/ZumitoTeam/zumito-db/stargazers
[issues-shield]: https://img.shields.io/github/issues/ZumitoTeam/zumito-db.svg?style=for-the-badge
[issues-url]: https://github.com/ZumitoTeam/zumito-db/issues
[license-shield]: https://img.shields.io/github/license/ZumitoTeam/zumito-db.svg?style=for-the-badge
[license-url]: https://github.com/ZumitoTeam/zumito-db/blob/main/LICENSE
[npm-shield]: https://img.shields.io/npm/v/zumito-db.svg?style=for-the-badge
[npm-url]: https://www.npmjs.com/package/zumito-db
