const examCtrl = require('../controllers/examCtrl.js');

function examRoute(app) {
	app.post('/api/check/join-exam', examCtrl.joinExam);
	app.get('/api/exam', examCtrl.getExams);
	app.get('/api/exam-paper', examCtrl.getExamPaper);
	app.post('/api/exam-paper/answer', examCtrl.studentAnswer);
	app.post('/api/exam-paper/flag', examCtrl.studentChangeFlag);
	app.post('/api/exam-paper/submit', examCtrl.submitExam);
}

module.exports = examRoute;
