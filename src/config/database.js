const pg = require('pg');
const moment = require('moment');

const { Pool } = pg;

const pool = new Pool({
	host: process.env.PG_HOST,
	user: process.env.PG_USER,
	password: process.env.PG_PASSWORD,
	database: process.env.PG_DATABASE,
	port: process.env.PG_PORT,
});

const parseFn = (val) =>
	val === null ? null : moment(val).format('DD/MM/YYYY HH:mm:ss');
const types = pg.types;

types.setTypeParser(types.builtins.TIMESTAMPTZ, parseFn);
types.setTypeParser(types.builtins.TIMESTAMP, parseFn);
types.setTypeParser(types.builtins.DATE, parseFn);

const query = (text, params, callback) => pool.query(text, params, callback);

module.exports = { query };
