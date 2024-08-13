## About Zumito-DB

Zumito-DB is cross-db ORM for nodejs, providing common interface to access
most popular database formats. We are a fork of the [CaminteJS](
https://github.com/biggora/caminte)/[CanarioJS](https://github.com/ZumitoTeam/zumito-db/) projects, which hasn't received updates for a few years.

#### Zumito-DB adapters:
    mysql, sqlite3, postgres, couchdb, mongodb, redis, neo4j, firebird, rethinkdb, tingodb

<table>
    <tr>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/memory.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/mongodb.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/mysql.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/postgresql.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/sqlite.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/mariadb.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/firebird.png"/></td>   
    </tr>
    <tr>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/couchdb.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/rethinkdb.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/redis.png"/></td> 
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/tingodb.png"/></td>      
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/neo4j.png"/></td> 
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/arangodb.png"/></td>
      <td><img width="100" src="https://github.com/ZumitoTeam/zumito-db/raw/main/media/cassandra.png"/></td>
    </tr>
</table>

## Installation

First install [node.js](http://nodejs.org/). Then:

```bash
npm install zumito-db
# or
yarn add zumito-db
```

## Usage

```javascript
var zumitodb = require('zumito-db');
var Schema  = zumitodb.Schema;
var schema  = new Schema('redis', {port: 6379});

// define models
var Post = schema.define('Post', {
    title:     { type: schema.String,  limit: 255 },
    userId:    { type: schema.Number },
    content:   { type: schema.Text },
    created:   { type: schema.Date,    default: Date.now },
    updated:   { type: schema.Date },
    published: { type: schema.Boolean, default: false, index: true }
});

var User = schema.define('User', {
    name:       { type: schema.String,  limit: 255 },
    bio:        { type: schema.Text },
    email:      { type: schema.String,  limit: 155, unique: true },
    approved:   { type: schema.Boolean, default: false, index: true }
    joinedAt:   { type: schema.Date,    default: Date.now },
    age:        { type: schema.Number },
    gender:     { type: schema.String,  limit: 10 }
});

// setup hooks
Post.afterUpdate = function (next) {
    this.updated = new Date();
    this.save();
    next();
};

// define any custom method for instance
User.prototype.getNameAndAge = function () {
    return this.name + ', ' + this.age;
};

// define scope
Post.scope('active', { published : true });

// setup validations
User.validatesPresenceOf('name', 'email');
User.validatesUniquenessOf('email', {message: 'email is not unique'});
User.validatesInclusionOf('gender', {in: ['male', 'female']});
User.validatesNumericalityOf('age', {int: true});

// setup relationships
User.hasMany(Post,   {as: 'posts',  foreignKey: 'userId'});

// Common API methods

var user = new User({ 
    name:       'Leandro',
    email:      'example@domain.com',
    age:        37,
    gender:     'male'
});

user.isValid(function (valid) {
    if (!valid) {
        return console.log(user.errors);
    }
    user.save(function(err){
        if (!err) {
            return console.log(err);
        }
        console.log('User created');
    });
})

// just instantiate model
new Post
// save model (of course async)
Post.create(cb);
// all posts
Post.all(cb)
// all posts by user
Post.all({where: {userId: user.id}, order: 'id', limit: 10, skip: 20});
// the same as prev
user.posts(cb)
// get one latest post
Post.findOne({where: {published: true}, order: 'date DESC'}, cb);
// same as new Post({userId: user.id});
user.posts.build
// save as Post.create({userId: user.id}, cb);
user.posts.create(cb)
// find instance by id
User.findById(1, cb)
// count instances
User.count([conditions, ]cb)
// destroy instance
user.destroy(cb);
// destroy all instances
User.destroyAll(cb);

// models also accessible in schema:
schema.models.User;
schema.models.Post;
```

## Package structure

Now all common logic described in `./lib/*.js`, and database-specific stuff in `./lib/adapters/*.js`. It's super-tiny, right?

## Contributing

If you have found a bug please write unit test, and make sure all other tests still pass before pushing code to repo.

## License

The MIT License (MIT)

Copyright (c) 2022 Leandro A Silva

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## Resources

- Report issues on the [github issues](https://github.com/ZumitoTeam/zumito-db/issues) page.

