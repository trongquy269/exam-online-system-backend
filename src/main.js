const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');
const cookieParser = require('cookie-parser');
const { userAuth } = require('./utils.js');

require('dotenv').config();

const routes = require('./routes/index.js');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
	cors({
		origin: process.env.CLIENT_BASE_URL,
		credentials: true,
	})
);
app.use(cookieParser());
app.use(userAuth);

// Routes
routes(app);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

// https
// 	.createServer(
// 		{
// 			key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem'), {
// 				encoding: 'utf8',
// 			}),
// 			cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'), {
// 				encoding: 'utf8',
// 			}),
// 		},
// 		app
// 	)
// 	.listen(port, () => {
// 		console.log(`Server is running on port ${port}`);
// 	});
