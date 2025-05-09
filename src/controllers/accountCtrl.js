const accountModel = require('../models/accountModel.js');
const sha512 = require('crypto-js/sha512');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const transporter = require('../config/sendmail.js');

const filePath = path.join(__dirname, '../private.key');
const jwtSecret = fs.readFileSync(filePath, { encoding: 'utf8' });
// jwt.verify(token, jwtSecret, (err, decoded) => {
// 	console.log(decoded);
// });

let VERIFY_CODE = '';

function hash(str) {
	return sha512(str).toString();
}

function login(req, res) {
	const username = req.body.username;
	const password = req.body.password;

	accountModel.login([atob(username)], (err, result) => {
		if (err) throw err;

		if (result.rows.length === 0) {
			res.status(401).json({ message: 'Username does not exist' });
			return;
		}

		const resultPassword = result?.rows[0]?.password;

		if (resultPassword !== hash(atob(password))) {
			res.status(401).json({ message: 'Wrong password' });
			return;
		}

		const user = result?.rows[0];

		const data = JSON.stringify({
			...(user.student_id ? { student_id: user.student_id } : {}),
			...(user.lecturer_id ? { lecturer_id: user.lecturer_id } : {}),
			name: user.name,
			email: user.email,
			role: user.role,
		});
		const token = jwt.sign({ data }, jwtSecret, {
			expiresIn: '4h',
			algorithm: 'HS256',
		});

		res.setHeader(
			'Set-Cookie',
			`token=${token}; Max-Age=14400; SameSite=strict; httpOnly`
		);

		// res.cookie('token', token, {
		// 	maxAge: 60 * 60 * 1000 * 4,
		// 	httpOnly: true,
		// 	sameSite: 'strict',
		// });
		res.status(200).json({ message: 'Success' });
	});
}
function getVerifyCode(req, res) {
	const email = req.body.email;

	VERIFY_CODE = Math.floor(Math.random() * 1000000).toString();
	const mailOptions = {
		from: '"e-Exam" <process.env.MAIL_USERNAME>',
		to: email,
		subject: 'Xác nhận tài khoản e-Exam',
		text: 'Xác nhận tài khoản e-Exam',
		html: `
			<div style="border: 1px solid #ccc; width: 500px; max-width: 90%; padding: 16px; border-radius: 10px; color: #111; margin: 0 auto;">
				<h3 style="width: 100%; text-align: center;">e-Exam</h3>
				<h2 style="width: 100%; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 36px;">Xác nhận thông tin tạo tài khoản</h2>
				<p>e-Exam đã nhận được yêu cầu của <b>${email}</b> về việc tạo tài khoản của bạn.</p>
				<p>Sử dụng mã này để hoàn tất việc tạo tài khoản của bạn.</p>
				<h1 style="width: 100%; text-align: center;">${VERIFY_CODE}</h1>
				<p>Mã này sẽ hết hạn sau 1 phút.</p>
				<p>Nếu bạn không nhận ra <b>${email}</b>, bạn có thể yên tâm bỏ qua email này.</p>
			</div>
		`,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
			res.status(500).json({ message: 'Failed to send email' });
		} else {
			setTimeout(() => {
				VERIFY_CODE = '';
			}, 60 * 1000);

			res.status(200).json({ message: 'Email sent' });
		}
	});
}

function verifyCode(req, res) {
	const code = req.body.code;

	if (code === VERIFY_CODE) {
		res.status(200).json({ message: 'Success' });
	} else {
		res.status(401).json({ message: 'Wrong code' });
	}
}

function register(req, res) {
	const name = req.body.name;
	const dateOfBirth = req.body.dateOfBirth;
	const gender = req.body.gender;
	const email = req.body.email;
	const phone = req.body.phone;
	const username = req.body.username;
	const password = req.body.password;
	const role = req.body.role;

	const createStudentID = () => {
		accountModel.numberOfRowsStudent((err, result) => {
			if (err) throw err;

			const newRow = +result.rows[0].count + 1;
			const studentID = newRow.toString().padStart(7, '0');
			const currentYear = new Date().getFullYear();
			const lastTwoDigits = currentYear.toString().slice(-2);

			return 'U' + lastTwoDigits + studentID;
		});
	};

	const createLecturerID = () => {
		accountModel.numberOfRowsLecturer((err, result) => {
			if (err) throw err;

			const newRow = +result.rows[0].count + 1;
			const lecturerID = newRow.toString().padStart(7, '0');
			const currentYear = new Date().getFullYear();
			const lastTwoDigits = currentYear.toString().slice(-2);

			return 'U' + lastTwoDigits + lecturerID;
		});
	};

	if (role === 'student') {
		accountModel.login([username], (err, result) => {
			if (err) throw err;

			if (result.rows.length !== 0) {
				res.status(401).json({ message: 'Username already exists' });
			} else {
				accountModel.addNewStudent(
					[
						name,
						dateOfBirth,
						gender,
						email,
						phone,
						username,
						hash(atob(password)),
					],
					(err, _result) => {
						if (err) throw err;

						const student_id = createStudentID();

						const data = JSON.stringify({
							student_id,
							name,
							email,
							role: 'student',
						});
						const token = jwt.sign({ data }, jwtSecret, {
							expiresIn: '4h',
							algorithm: 'HS256',
						});

						res.setHeader(
							'Set-Cookie',
							`token=${token}; Max-Age=14400; SameSite=strict; httpOnly`
						);

						// res.cookie('token', token, {
						// 	maxAge: 60 * 60 * 1000 * 4,
						// 	httpOnly: true,
						// });
						res.status(200).json({ message: 'Success' });
					}
				);
			}
		});
	} else if (role === 'lecturer') {
		accountModel.login([username], (err, result) => {
			if (err) throw err;

			if (result.rows.length !== 0) {
				res.status(401).json({ message: 'Username already exists' });
			} else {
				accountModel.addNewLecturer(
					[
						name,
						dateOfBirth,
						gender,
						email,
						phone,
						username,
						hash(atob(password)),
					],
					(err, _result) => {
						if (err) throw err;

						const lecturer_id = createLecturerID();

						const data = JSON.stringify({
							lecturer_id,
							name,
							email,
							role: 'lecturer',
						});
						const token = jwt.sign({ data }, jwtSecret, {
							expiresIn: '4h',
							algorithm: 'HS256',
						});

						res.setHeader(
							'Set-Cookie',
							`token=${token}; Max-Age=14400; SameSite=strict; httpOnly`
						);

						// res.cookie('token', token, {
						// 	maxAge: 60 * 60 * 1000 * 4,
						// 	httpOnly: true,
						// });
						res.status(200).json({ message: 'Success' });
					}
				);
			}
		});
	}
}

function isLogin(req, res) {
	const token = req.cookies.token;

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

		return res.status(200).json({
			message: 'Success',
			user_name: JSON.parse(decoded.data).name,
			user_id:
				JSON.parse(decoded.data).student_id ||
				JSON.parse(decoded.data).lecturer_id,
		});
	});
}

function logout(req, res) {
	res.setHeader('Set-Cookie', `token=; Max-Age=; SameSite=; httpOnly`);

	res.status(200).json({ message: 'Success' });
}

module.exports = {
	login,
	getVerifyCode,
	verifyCode,
	register,
	isLogin,
	logout,
};
