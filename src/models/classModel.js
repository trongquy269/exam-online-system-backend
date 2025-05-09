const db = require('../config/database.js');

function getAllClass([student_id, limit, offset], callback) {
	let query = `
		SELECT classes.class_id, classes.name, classes.create_date, lecturers.name AS "lecturer_name"
		FROM classes
		JOIN lecturers ON classes.lecturer_id = lecturers.lecturer_id
		LEFT JOIN student_in_class as sic ON classes.class_id = sic.class_id
				AND sic.student_id = $1
		WHERE classes.is_hide = false
			AND sic.student_id IS NULL
		ORDER BY create_date DESC
	`;

	const params = [student_id];

	if (!!limit) {
		query += 'LIMIT $2';
		params.push(limit);
	}
	if (!!offset) {
		query += 'OFFSET $3';
		params.push(offset);
	}

	db.query(query, params, callback);
}

function getAllMyClass([userID, limit, offset], callback) {
	let query = `
		SELECT classes.class_id, classes.name, classes.create_date, lecturers.name AS "lecturer_name", student_in_class.date_admission
		FROM classes
		JOIN lecturers ON classes.lecturer_id = lecturers.lecturer_id
		JOIN student_in_class ON classes.class_id = student_in_class.class_id
		WHERE student_in_class.student_id = $1
		ORDER BY student_in_class.date_admission DESC
	`;

	const params = [userID];

	if (!!limit) {
		query += 'LIMIT $2';
		params.push(limit);
	}
	if (!!offset) {
		query += 'OFFSET $3';
		params.push(offset);
	}

	db.query(query, params, callback);
}

function getClassByID([classID], callback) {
	db.query(
		`
			SELECT classes.class_id, classes.name, classes.create_date, lecturers.name AS "lecturer_name"
			FROM classes, lecturers
			WHERE classes.lecturer_id = lecturers.lecturer_id
				AND classes.class_id = $1
		`,
		[classID],
		callback
	);
}

function getAllStudentInClass([classID], callback) {
	db.query(
		`
			SELECT s.student_id, s.name
			FROM classes as c
			JOIN student_in_class as sic ON c.class_id = sic.class_id
			JOIN students as s ON sic.student_id = s.student_id
			WHERE c.class_id = $1
		`,
		[classID],
		callback
	);
}

function getClassExams([classID, studentID], callback) {
	db.query(
		`
			SELECT DISTINCT e.name, e.is_hide, e.date_creation, ep.exam_paper_id,
				CASE
					WHEN st.student_id IS NOT NULL THEN true
					ELSE false
				END AS "is_exam"
			FROM classes as c
			JOIN exam as e ON c.class_id = e.class_id
			JOIN exam_papers as ep ON e.exam_paper_id = ep.exam_paper_id
			LEFT JOIN student_test as st ON ep.exam_paper_id = st.exam_paper_id
				AND st.student_id = $2
			WHERE c.class_id = $1
			ORDER BY e.date_creation ASC
		`,
		[classID, studentID],
		callback
	);
}

function getPasswordByClassID([classID], callback) {
	db.query(
		`
			SELECT password
			FROM classes
			WHERE class_id = $1
		`,
		[classID],
		callback
	);
}

function joinClass([studentID, classID], callback) {
	db.query(
		`
			INSERT INTO student_in_class (student_id, class_id, date_admission)
			VALUES ($1, $2, NOW())
		`,
		[studentID, classID],
		callback
	);
}

function leaveClass([studentID, classID], callback) {
	db.query(
		`
			DELETE FROM student_in_class
			WHERE student_id = $1
				AND class_id = $2
		`,
		[studentID, classID],
		callback
	);
}

module.exports = {
	getAllClass,
	getAllMyClass,
	getClassByID,
	getAllStudentInClass,
	getClassExams,
	getPasswordByClassID,
	joinClass,
	leaveClass,
};
