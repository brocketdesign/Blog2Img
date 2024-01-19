const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require('./api'); // Adjust the path according to your file structure

const app = express();
const PORT = process.env.PORT || 5000;

const cors = require('cors');
// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Use the API router
app.use('/api', apiRouter); // This will prefix all routes defined in api.js with '/api'

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
