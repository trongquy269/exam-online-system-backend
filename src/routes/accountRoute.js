const accountCtrl = require('../controllers/accountCtrl.js');

function accountRoute(app) {
	app.post('/api/login', accountCtrl.login);
	app.post('/api/register', accountCtrl.register);
	app.post('/api/request/verify-code', accountCtrl.getVerifyCode);
	app.post('/api/check/verify-code', accountCtrl.verifyCode);
	app.post('/api/check/login', accountCtrl.isLogin);
	app.post('/api/logout', accountCtrl.logout);
}

module.exports = accountRoute;
