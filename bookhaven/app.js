const express = require('express');
const ejsMate = require('ejs-mate');
const path = require('path');
const mysql = require('mysql2/promise'); // Using promises for cleaner async/await
const app = express();

app.engine('ejs', ejsMate)
app.set( 'view engine', 'ejs' )
app.set('views', path.join(__dirname, 'views'))


// Replace with your actual database credentials
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'your_database_user',
  password: 'your_database_password',
  database: 'bookhaven',
}).promise() ;

// Route to handle data retrieval and display
app.get('/', (req, res) => {
    res.render('home');
})




app.get('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

// Serve static files (HTML, CSS, etc.) from a public directory (create it)
app.use(express.static('public'));

// Set the templating engine (if using one)
// ... (e.g., for EJS: app.set('view engine', 'ejs');)

// Start the server
// const port = process.env.PORT || 5000;
const port = 5000
app.listen(port, () => console.log(`Server listening on port ${port}`));