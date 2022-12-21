/**
 * Basic class SQL.
 */
class BaseSQL {
  constructor() {}

  query() {
    throw new Error("query method should be declared in adapter");
  }

  command(sql, callback) {
    return this.query(sql, callback);
  }

  queryOne(sql, callback) {
    return this.query(sql, function (err, data) {
      if (err) {
        return callback && callback(err);
      }
      return callback && callback(err, data[0]);
    });
  }

  table(model) {
    return this._models[model].model.schema.tableName(model);
  }

  escapeName(name) {
    throw new Error("escapeName method should be declared in adapter");
  }

  tableEscaped(model) {
    return this.escapeName(this.table(model));
  }

  define(descr) {
    if (!descr.settings) {
      descr.settings = {};
    }
    this._models[descr.model.modelName] = descr;
  }

  defineProperty(model, prop, params) {
    this._models[model].properties[prop] = params;
  }

  save(model, data, callback) {
    let sql =
      "UPDATE " +
      this.tableEscaped(model) +
      " SET " +
      this.toFields(model, data) +
      " WHERE " +
      this.escapeName("id") +
      " = " +
      data.id;

    this.query(sql, function (err) {
      return callback && callback(err);
    });
  }

  exists(model, id, callback) {
    id = getInstanceId(id);
    let sql =
      "SELECT 1 FROM " +
      this.tableEscaped(model) +
      " WHERE " +
      this.escapeName("id") +
      " = " +
      id +
      " LIMIT 1";

    this.query(sql, function (err, data) {
      if (err) {
        return callback(err);
      }
      return callback && callback(null, data.length === 1);
    });
  }

  findByIdfindById(model, id, callback) {
    id = getInstanceId(id);
    let self = this;
    let sql =
      "SELECT * FROM " +
      self.tableEscaped(model) +
      " WHERE " +
      self.escapeName("id") +
      " = " +
      id +
      " LIMIT 1";

    self.query(
      sql,
      function (err, data) {
        if (data && data.length === 1) {
          data[0].id = id;
        } else {
          data = [null];
        }
        return callback && callback(err, self.fromDatabase(model, data[0]));
      }.bind(self)
    );
  }

  remove(model, cond, callback) {
    let self = this,
      sql = "DELETE FROM " + this.tableEscaped(model) + " ";
    if (!cond) {
      cond = {};
    }
    if (cond.where) {
      sql += self.buildWhere(cond.where, self, model);
      self.command(sql, function (err) {
        return callback && callback(err);
      });
    } else {
      return callback && callback("Undefined cond.where");
    }
  }

  destroy(model, id, callback) {
    let sql =
      "DELETE FROM " +
      this.tableEscaped(model) +
      " WHERE " +
      this.escapeName("id") +
      " = " +
      getInstanceId(id);
    this.command(sql, function (err) {
      return callback && callback(err);
    });
  }

  destroyAll(model, callback) {
    this.command(
      "DELETE FROM " + this.tableEscaped(model),
      function (err) {
        if (err) {
          return callback && callback(err, []);
        }
        return callback && callback(err, []);
      }.bind(this)
    );
  }

  count(model, callback, cond) {
    let self = this,
      sql = "SELECT count(*) as cnt FROM " + self.tableEscaped(model) + " ";
    if (cond && cond.where) {
      sql += self.buildWhere(cond.where, self, model);
    }
    self.queryOne(sql, function (err, res) {
      if (err) {
        return callback && callback(err);
      }
      let cnt = parseInt((res && res.cnt) || 0);
      return callback && callback(err, cnt);
    });
  }

  updateAttrs(model, id, data, cb) {
    data.id = getInstanceId(id);
    this.save(model, data, cb);
  }

  disconnect() {
    this.client.end();
  }

  /**
   * Re create existing database tables.
   * @param {Function} cb
   */
  automigrate(cb) {
    let self = this;
    let wait = 0;

    Object.keys(this._models).forEach(function (model) {
      wait += 1;
      self.dropTable(model, function (err) {
        if (err) {
          console.log(err);
        }
        self.createTable(model, function (err) {
          if (err) {
            console.log(err);
          }
          return done && done();
        });
      });
    });

    if (wait === 0) {
      cb();
    }

    function done() {
      if (--wait === 0 && cb) {
        cb();
      }
    }
  }

  dropTable(model, cb) {
    this.command("DROP TABLE IF EXISTS " + this.tableEscaped(model), cb);
  }

  createTable(model, indexes, cb) {
    let self = this,
      m = self._models[model];
    if ("function" === typeof indexes) {
      cb = indexes;
    }
    let sql =
      "CREATE TABLE " +
      self.tableEscaped(model) +
      " (\n  " +
      self.propertiesSQL(model) +
      "\n)";
    if (self.name === "mysql") {
      sql += " CHARSET=utf8;";
    } else if (self.name === "pg") {
      // TODO
      // sql = 'PRAGMA encoding = 'UTF-8'; ' + sql;
    } else if (self.name === "cassandra") {
      // add sorting indexes
      if (m.settings.orderBy && m.settings.orderBy.columns) {
        let oda = m.settings.orderBy;
        let odd = oda.direction ? oda.direction.toUpperCase() : "ASC";
        sql += " WITH CLUSTERING ORDER BY (" + oda.columns + " " + odd + ")";
      }
    }

    try {
      self.command(sql, function (err) {
        if (err) {
          // console.log('ERROR CREATE TABLE 1: ', model, sql, err);
        }
        //  || self.name === 'cassandra'
        if (self.name === "sqlite3" || self.name === "mysql") {
          self.createIndexes(model, self._models[model], cb);
        } else {
          return cb && cb();
        }
      });
    } catch (err) {
      // console.log('ERROR CREATE TABLE 2: ', model, sql, err);
      return cb && cb();
    }
  }

  /**
   * Normalize id
   *
   * @param {Mixed} id
   */
  getInstanceId(id) {
    if (typeof id === "object" && id.constructor === Array) {
      id = id[0];
    }
    return id;
  }
}

module.exports = BaseSQL;
