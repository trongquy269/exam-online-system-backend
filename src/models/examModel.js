const db = require('../config/database.js');

function getPasswordByExamID([examID], callback) {
	db.query(
		`
			SELECT exam.password
			FROM exam, exam_papers
			WHERE exam.exam_paper_id = exam_papers.exam_paper_id
				AND exam_papers.exam_paper_id = $1
		`,
		[examID],
		callback
	);
}

function getExamInfo([examID, classID], callback) {
	db.query(
		`
			SELECT e.name, e.day_begin, e.day_end, e.mark_achieved, e.max_times, ep.name as exam_paper_name, ep.duration, ep.question_quantity_max, l.name AS lecturer_name, c.name AS class_name
			FROM exam AS e
			JOIN exam_papers AS ep ON e.exam_paper_id = ep.exam_paper_id
			JOIN classes AS c ON e.class_id = c.class_id AND c.class_id = $2
			JOIN lecturers AS l ON c.lecturer_id = l.lecturer_id
			WHERE e.exam_paper_id = $1
		`,
		[examID, classID],
		callback
	);
}

function checkStudentTested([studentID, examID], callback) {
	db.query(
		`
			SELECT st.student_test_id, st.mark, st.time_start, st.time_end, st.times
			FROM exam_papers AS ep
			JOIN student_test AS st ON ep.exam_paper_id = st.exam_paper_id
				AND st.student_id = $1
			WHERE ep.exam_paper_id = $2
			ORDER BY st.time_start ASC
		`,
		[studentID, examID],
		callback
	);
}

function getAllQuestions([examPaperID], callback) {
	db.query(
		`
			SELECT *
			FROM questions
			WHERE exam_paper_id = $1
		`,
		[examPaperID],
		callback
	);
}

function studentJoinExam([studentTestID, studentID, examID, times], callback) {
	db.query(
		`
			INSERT INTO student_test (student_test_id, time_start, times, exam_paper_id, student_id)
			VALUES ($1, NOW(), $4, $3, $2)
		`,
		[studentTestID, studentID, examID, times],
		callback
	);
}

function addQuestionsForStudent(
	[
		questions,
		answerA,
		answerB,
		answerC,
		answerD,
		sequenceNumber,
		studentTestID,
	],
	callback
) {
	db.query(
		`
			INSERT INTO questions_for_student (question, answer_a, answer_b, answer_c, answer_d, student_answer, is_flag, sequence_number, student_test_id)
			VALUES ($1, $2, $3, $4, $5, '', false, $6, $7)
		`,
		[
			questions,
			answerA,
			answerB,
			answerC,
			answerD,
			sequenceNumber,
			studentTestID,
		],
		callback
	);
}

function getTimes([studentID, examID], callback) {
	db.query(
		`
			SELECT times
			FROM student_test
			WHERE student_id = $1
				AND exam_paper_id = $2
			ORDER BY times ASC
		`,
		[studentID, examID],
		callback
	);
}

function getExamPaperInfoByID([studentTestID], callback) {
	db.query(
		`
			SELECT st.time_start, st.times, ep.name as exam_paper_name, ep.duration, e.name as exam_name, c.name as class_name, l.name as lecturer_name,
				CASE
					WHEN NULLIF(st.mark::text, '') IS NOT NULL THEN st.mark
					ELSE NULL
				END AS mark
			FROM student_test as st
			JOIN exam_papers as ep ON st.exam_paper_id = ep.exam_paper_id
			JOIN exam as e ON ep.exam_paper_id = e.exam_paper_id
			JOIN classes as c ON e.class_id = c.class_id
			JOIN lecturers as l ON c.lecturer_id = l.lecturer_id
			WHERE st.student_test_id = $1
		`,
		[studentTestID],
		callback
	);
}

function getQuestionsByID([studentTestID], callback) {
	db.query(
		`
			SELECT question, answer_a, answer_b, answer_c, answer_d, student_answer, is_flag, sequence_number
			FROM questions_for_student
			WHERE student_test_id = $1
			ORDER BY sequence_number ASC
		`,
		[studentTestID],
		callback
	);
}

function addStudentAnswer([question, studentAnswer, studentTestID], callback) {
	db.query(
		`
			UPDATE questions_for_student
			SET student_answer = $2
			WHERE student_test_id = $3
				AND question = $1
		`,
		[question, studentAnswer, studentTestID],
		callback
	);
}

function changeFlag([question, status, studentTestID], callback) {
	db.query(
		`
			UPDATE questions_for_student
			SET is_flag = $2
			WHERE student_test_id = $3
				AND question = $1
		`,
		[question, status, studentTestID],
		callback
	);
}

function calculateMark([studentTestID], callback) {
	db.query(
		`
			SELECT COUNT(*) AS correct_answers
			FROM questions_for_student
			WHERE student_test_id = $1
				AND answer_a = student_answer
		`,
		[studentTestID],
		callback
	);
}

function updateFinalTest([studentTestID, mark], callback) {
	db.query(
		`
			UPDATE student_test
			SET time_end = NOW(), mark = $2
			WHERE student_test_id = $1
		`,
		[studentTestID, mark],
		callback
	);
}

module.exports = {
	getPasswordByExamID,
	getExamInfo,
	checkStudentTested,
	getAllQuestions,
	studentJoinExam,
	addQuestionsForStudent,
	getTimes,
	getExamPaperInfoByID,
	getQuestionsByID,
	addStudentAnswer,
	changeFlag,
	calculateMark,
	updateFinalTest,
};
