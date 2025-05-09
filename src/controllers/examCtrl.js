const examModel = require('../models/examModel.js');
const {
	getUserByToken,
	hash,
	getRandomQuestions,
	convertAnswerToArray,
} = require('../utils.js');

function joinExam(req, res) {
	const token = req.authToken;
	const examID = req.body.exam_id;
	const password = atob(req.body.password);

	const user = getUserByToken(token);
	const role = user.role;
	const response = { message: '', auth: token };

	if (role === 'student') {
		examModel.getPasswordByExamID([examID], (err, result) => {
			if (err) throw err;

			if (result.rows.length === 0) {
				return res.status(404).json({ message: 'Exam not found' });
			}

			if (result.rows[0].password !== hash(password)) {
				return res.status(401).json({ message: 'Wrong password' });
			}

			response.message = 'Success';
			return res.status(200).json(response);
		});
	}
}

function getExams(req, res) {
	const token = req.authToken;
	const examID = req.query.exam_id;

	const user = getUserByToken(token);
	const role = user.role;
	const response = { data: {}, auth: token };
	const classID = examID.substring(0, 8);

	if (role === 'student') {
		const studentID = user.student_id;

		examModel.getExamInfo([examID, classID], (err, result) => {
			if (err) throw err;

			if (result.rows.length === 0) {
				return res.status(404).json({ message: 'Exam not found' });
			}

			response.data = result.rows[0];

			examModel.checkStudentTested([studentID, examID], (err, result) => {
				if (err) throw err;

				response.data = { ...response.data, tested: result.rows };
				return res.status(200).json(response);
			});
		});
	}
}

async function getExamPaper(req, res) {
	const token = req.authToken;
	const examID = req.query.exam_id;

	const user = getUserByToken(token);
	const role = user.role;
	const response = { data: { id: '', questions: [] }, auth: token };

	if (role === 'student') {
		try {
			const student_id = user.student_id;

			// Step 1: Get times
			const testTimes = await new Promise((resolve, reject) => {
				examModel.getTimes([student_id, examID], (err, result) => {
					if (err) throw err;

					resolve(result);
				});
			});

			const suffixes =
				testTimes.rows.length === 0 ? 0 : testTimes.rows.length - 1;

			const studentTestID = `${student_id}${examID}${suffixes}`;

			// Step 2: Get exam paper if student is tested
			const tested = await new Promise((resolve, reject) => {
				examModel.getExamPaperInfoByID(
					[studentTestID],
					(err, result) => {
						if (err) throw err;

						resolve(result);
					}
				);
			});

			if (tested.rows.length !== 0 && tested.rows[0].mark === null) {
				response.data = { ...response.data, ...tested.rows[0] };

				// Step 3: Get questions for student
				const questionsForStudent = await new Promise(
					(resolve, reject) => {
						examModel.getQuestionsByID(
							[studentTestID],
							(err, result) => {
								if (err) throw err;

								resolve(result);
							}
						);
					}
				);

				response.data.questions = convertAnswerToArray(
					questionsForStudent.rows
				);
				response.data.id = studentTestID;
			} else if (
				tested.rows.length === 0 ||
				tested.rows[0].mark !== null
			) {
				const newStudentTestID = `${student_id}${examID}${testTimes.rows.length}`;

				// Step 3: Add student test
				await new Promise((resolve, reject) => {
					examModel.studentJoinExam(
						[
							newStudentTestID,
							student_id,
							examID,
							testTimes.rows.length + 1,
						],
						(err, result) => {
							if (err) throw err;
							resolve();
						}
					);
				});

				// Step 4: Get questions
				const questions = await new Promise((resolve, reject) => {
					examModel.getAllQuestions([examID], (err, result) => {
						if (err) throw err;

						if (result.rows.length === 0) {
							return res
								.status(404)
								.json({ message: 'Exam not found' });
						}

						resolve(result);
					});
				});

				const shuffleQuestions = getRandomQuestions(questions.rows, 20);

				// Step 5: Add questions for student
				await Promise.all(
					shuffleQuestions.map(
						(question, index) =>
							new Promise((resolve, reject) => {
								examModel.addQuestionsForStudent(
									[
										question.question,
										question.answer_a,
										question.answer_b,
										question.answer_c,
										question.answer_d,
										index + 1,
										newStudentTestID,
									],
									(err, result) => {
										if (err) {
											reject(err);
										} else {
											resolve(result);
										}
									}
								);
							})
					)
				);

				// Step 6: Get exam paper
				const examPaper = await new Promise((resolve, reject) => {
					examModel.getExamPaperInfoByID(
						[newStudentTestID],
						(err, result) => {
							if (err) throw err;

							resolve(result);
						}
					);
				});

				response.data = { ...response.data, ...examPaper.rows[0] };

				// Step 7: Get questions for student
				const questionsForStudent = await new Promise(
					(resolve, reject) => {
						examModel.getQuestionsByID(
							[newStudentTestID],
							(err, result) => {
								if (err) throw err;

								resolve(result.rows);
							}
						);
					}
				);

				response.data.questions =
					convertAnswerToArray(questionsForStudent);
				response.data.id = newStudentTestID;
			}

			// Final response
			res.status(200).json(response);
		} catch (err) {
			console.log(err);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}
}

function studentAnswer(req, res) {
	const question = req.body.question;
	const answer = req.body.answer;
	const studentTestID = req.body.studentTestID;

	examModel.addStudentAnswer(
		[question, answer, studentTestID],
		(err, result) => {
			if (err) throw err;

			res.status(200).json({ message: 'Success' });
		}
	);
}

function studentChangeFlag(req, res) {
	const question = req.body.question;
	const status = req.body.status;
	const studentTestID = req.body.studentTestID;

	examModel.changeFlag([question, status, studentTestID], (err, result) => {
		if (err) throw err;

		res.status(200).json({ message: 'Success' });
	});
}

async function submitExam(req, res) {
	const token = req.authToken;
	const studentTestID = req.body.studentTestID;

	const user = getUserByToken(token);
	const response = { message: '', auth: token };

	try {
		// Step 1: Calculate mark
		const mark = await new Promise((resolve, reject) => {
			examModel.calculateMark([studentTestID], (err, result) => {
				if (err) throw err;

				resolve(result.rows[0].correct_answers);
			});
		});

		const markReal = !!mark ? mark : 0;

		// Step 2: Update final test
		await new Promise((resolve, reject) => {
			examModel.updateFinalTest(
				[studentTestID, markReal],
				(err, result) => {
					if (err) throw err;
					resolve();
				}
			);
		});

		// Final response
		response.message = 'Success';
		res.status(200).json(response);
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

module.exports = {
	joinExam,
	getExams,
	getExamPaper,
	studentAnswer,
	studentChangeFlag,
	submitExam,
};
