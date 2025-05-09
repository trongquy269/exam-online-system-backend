const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const sha512 = require('crypto-js/sha512');

const filePath = path.join(__dirname, './private.key');
const jwtSecret = fs.readFileSync(filePath, { encoding: 'utf8' });

function userAuth(req, res, next) {
	const token = req.cookies.token;
	const url = req.originalUrl;

	if (url.includes('login') || url.includes('register')) {
		return next();
	}

	if (!token) {
		return res.status(401).json({ message: 'Unauthorized' });
	}

	jwt.verify(token, jwtSecret, (err, decoded) => {
		if (err) {
			const name = err.name;
			const message = err.message;

			if (name === 'JsonWebTokenError') {
				if (message === 'invalid signature') {
					return res.status(401).json({ message: 'Unauthorized' });
				}
			}

			return res.status(500).json({ message: 'Internal server error' });
		}

		req.authToken = token;
	});

	next();
}

function getUserByToken(token) {
	let user = {};

	jwt.verify(token, jwtSecret, (err, decoded) => {
		user = JSON.parse(decoded.data);
	});

	return user;
}

function hash(str) {
	return sha512(str).toString();
}

function omit(obj, ...props) {
	return Object.fromEntries(
		Object.entries(obj).filter(([key]) => !props.includes(key))
	);
}

function getRandomQuestions(arr, quantity) {
	// Copy the array to avoid modifying the original array
	let arrCopy = arr.slice();

	// Fisher-Yates shuffle
	for (let i = arrCopy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
	}

	// Return the first `quantity` elements
	return arrCopy.slice(0, quantity);
}

function convertAnswerToArray(questions) {
	const shuffleArray = (arr) => {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}

		return arr;
	};

	return questions.map((question) => {
		// Extract answers
		const answers = [
			question.answer_a,
			question.answer_b,
			question.answer_c,
			question.answer_d,
		];

		// Shuffle the answers
		const shuffledAnswers = shuffleArray(answers);

		// Remove original answer keys
		delete question.answer_a;
		delete question.answer_b;
		delete question.answer_c;
		delete question.answer_d;
		delete question.exam_paper_id;

		// Add the shuffled answers to the question object
		question.answers = shuffledAnswers;

		return question;
	});
}

module.exports = {
	userAuth,
	getUserByToken,
	hash,
	omit,
	getRandomQuestions,
	convertAnswerToArray,
};
