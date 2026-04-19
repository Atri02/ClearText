/**
 * ClearText v2 – Database layer using @seald-io/nedb
 * Pure JavaScript, no native compilation required.
 * Each collection is stored as a separate .db file.
 */
const Datastore = require('@seald-io/nedb');
const path      = require('path');

const dir = path.join(__dirname, 'data');

const users        = new Datastore({ filename: path.join(dir, 'users.db'),        autoload: true });
const translations = new Datastore({ filename: path.join(dir, 'translations.db'), autoload: true });
const shares       = new Datastore({ filename: path.join(dir, 'shares.db'),       autoload: true });

// Indexes
users.ensureIndex({ fieldName: 'email', unique: true });
translations.ensureIndex({ fieldName: 'userId' });
translations.ensureIndex({ fieldName: 'createdAt' });
shares.ensureIndex({ fieldName: 'id', unique: true });

// Promisify helpers
function findOne(db, query) {
  return new Promise((res, rej) => db.findOne(query, (e, d) => e ? rej(e) : res(d)));
}
function find(db, query, sort = {}, limit = 0) {
  return new Promise((res, rej) => {
    let cursor = db.find(query).sort(sort);
    if (limit) cursor = cursor.limit(limit);
    cursor.exec((e, d) => e ? rej(e) : res(d));
  });
}
function insert(db, doc) {
  return new Promise((res, rej) => db.insert(doc, (e, d) => e ? rej(e) : res(d)));
}
function remove(db, query, options = {}) {
  return new Promise((res, rej) => db.remove(query, options, (e, n) => e ? rej(e) : res(n)));
}

module.exports = { users, translations, shares, findOne, find, insert, remove };
