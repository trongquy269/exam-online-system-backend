const account = require('./accountRoute.js');
const classes = require('./classRoute.js');
const exam = require('./examRoute.js');

const routes = [account, classes, exam];

function route(app) {
	routes.forEach((route) => route(app));
}

module.exports = route;
