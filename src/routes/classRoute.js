const classCtrl = require('../controllers/classCtrl.js');

function classRoute(app) {
	app.get('/api/classes', classCtrl.getClasses);
	app.get('/api/my-classes', classCtrl.getMyClasses);
	app.get('/api/class', classCtrl.getClassByID);
	app.post('/api/join-class', classCtrl.joinClass);
	app.delete('/api/leave-class', classCtrl.leaveClass);
}

module.exports = classRoute;
