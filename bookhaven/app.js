const express = require('express')
const mysql = require('mysql2/promise')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')

const ageValidation = require('./utils/ageValidation')
const isLoggedIn = require('./utils/isLoggedIn')
const ExpressError = require('./utils/ExpressError')

const app = express()

// Replace with your actual database credentials
const pool = mysql.createPool({
    host: 'your_database_host',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'bookhaven',
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs') 
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('__method'))
app.use(express.static(path.join(__dirname, 'public')))




app.get('/', (req, res) => {
    res.render('home')
} )

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async( (req, res, next) =>{
    try{
        //write code to make a new entry in sql table to register 

    }catch(err){
        req.flash('error', err.message);
        res.redirect('register')
    }
} ))

app.get('login', (req, res) => {
    res.render('login')
})

app.post('login', async((req, res, next)=>{
    try{
        const { email, passkey } = req.body;
        const user = await pool.query( `SELECT * 
                                        FROM Customer 
                                        WHERE email=${email} and passkey=${passkey}
                                    `)
    }
}))


app.get('books', (req, res, next) => {

    try{
        const [rows] = pool.query('SELECT * FROM books');
        const data = rows;
        res.render('browse-books', { data });
    }
    catch{
        next(new ExpressError('No Books Found', 400))
    }
})









app.get('*', (req, res, next) => {

})


app.use( ( err, req, res, next ) => {
    const { statusCode = 500 } = err;
    if(!err.message){
        err.message = 'Oh, No! Something went wrong T_T';
        req.status(statusCode).render('error', { err })
    }
} )


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});