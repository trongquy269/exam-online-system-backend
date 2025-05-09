const classModel = require('../models/classModel.js');
const { getUserByToken, hash, omit } = require('../utils.js');

function getClasses(req, res) {
	const offset = req.query.offset;
	const limit = req.query.limit || 10;
	const token = req.authToken;

	const user = getUserByToken(token);
	const student_id = user.student_id;

	classModel.getAllClass([student_id, limit, offset], (err, result) => {
		if (err) throw err;

		res.json({ data: result.rows, auth: token });
	});
}

function getMyClasses(req, res) {
	const offset = req.query.offset;
	const limit = req.query.limit || 10;
	const token = req.authToken;

	const user = getUserByToken(token);
	const userID = user.student_id;

	classModel.getAllMyClass([userID, limit, offset], (err, result) => {
		if (err) throw err;

		res.json({ data: result.rows, auth: token });
	});
}

async function getClassByID(req, res) {
	const token = req.authToken;
	const classID = req.query.class_id;

	const user = getUserByToken(token);
	const role = user.role;
	const studentID = user.student_id || 'none';
	const response = { data: {}, auth: token };

	try {
		// Step 1: Get class by ID
		const classResult = await new Promise((resolve, reject) => {
			classModel.getClassByID([classID], (err, result) => {
				if (err) return reject(err);

				if (result.rows.length === 0) {
					return res.status(404).json({ message: 'Class not found' });
				}

				resolve(result);
			});
		});

		response.data = { ...response.data, ...classResult.rows[0] };

		// Step 2: Get all students in class
		const studentsResult = await new Promise((resolve, reject) => {
			classModel.getAllStudentInClass([classID], (err, result) => {
				if (err) return reject(err);

				resolve(result);
			});
		});

		response.data = { ...response.data, students: studentsResult.rows };

		// Step 3: Get class exams
		const examsResult = await new Promise((resolve, reject) => {
			classModel.getClassExams([classID, studentID], (err, result) => {
				if (err) return reject(err);

				resolve(result);
			});
		});

		if (role === 'student') {
			const examFiltered = examsResult.rows.map((exam) =>
				omit(exam, 'is_hide')
			);
			response.data = { ...response.data, exams: examFiltered };
		} else {
			response.data = { ...response.data, exams: examsResult.rows };
		}

		// Final response
		res.json(response);
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: 'Internal server error' });
	}
}

function joinClass(req, res) {
	const token = req.authToken;
	const class_id = req.body.class_id;
	const password = atob(req.body.password);

	const user = getUserByToken(token);
	const student_id = user.student_id;
	const response = { message: '', auth: token };

	classModel.getPasswordByClassID([class_id], (err, result) => {
		if (err) throw err;

		if (result.rows.length === 0) {
			return res.status(404).json({ message: 'Class not found' });
		}

		if (result.rows[0].password !== hash(password)) {
			return res.status(401).json({ message: 'Wrong password' });
		}
		response.message = 'Success';

		classModel.joinClass([student_id, class_id], (err, result) => {
			if (err) throw err;

			response.message = 'Success';
			return res.json(response);
		});
	});
}

function leaveClass(req, res) {
	const token = req.authToken;
	const class_id = req.query.class_id;

	const user = getUserByToken(token);
	const student_id = user.student_id;
	const response = { message: '', auth: token };

	classModel.leaveClass([student_id, class_id], (err, result) => {
		if (err) throw err;

		response.message = 'Success';
		return res.json(response);
	});
}

module.exports = {
	getClasses,
	getMyClasses,
	getClassByID,
	joinClass,
	leaveClass,
};
