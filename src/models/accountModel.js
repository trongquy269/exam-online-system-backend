const db = require('../config/database.js');

function login([username], callback) {
	db.query(
		`
			WITH users AS (
				SELECT student_id, name, email, password, role
				FROM Students
				WHERE username = $1
				UNION ALL
				SELECT lecturer_id, name, email, password, role
				FROM Lecturers
				WHERE username = $1
			)
			SELECT *
			FROM users;
	`,
		[username],
		callback
	);
}

function addNewStudent(
	[name, dateOfBirth, gender, email, phone, username, password],
	callback
) {
	db.query(
		`
			INSERT INTO STUDENTS (name, date_of_birth, gender, email, phone_number, username, password, 'student', date_creation)
			VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		`[(name, dateOfBirth, gender, email, phone, username, password)],
		callback
	);
}

function addNewLecturer(
	[name, dateOfBirth, gender, email, phone, username, password],
	callback
) {
	db.query(
		`
			INSERT INTO STUDENTS (name, date_of_birth, gender, email, phone_number, username, password, 'lecturer', date_creation)
			VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		`[(name, dateOfBirth, gender, email, phone, username, password)],
		callback
	);
}

function numberOfRowsStudent(callback) {
	db.query('SELECT COUNT(*) FROM students', callback);
}

function numberOfRowsLecturer(callback) {
	db.query('SELECT COUNT(*) FROM students', callback);
}

module.exports = {
	login,
	addNewStudent,
	addNewLecturer,
	numberOfRowsStudent,
	numberOfRowsLecturer,
};
