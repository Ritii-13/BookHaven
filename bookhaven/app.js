const express = require('express')
const session = require('express-session')
const mysql = require('mysql2')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const path = require('path');
const flash = require('connect-flash');
// const LocalStrategy = require('passport-local').Strategy;


const ageValidation = require('./utils/ageValidation')
const isLoggedIn = require('./utils/isLoggedIn')
const ExpressError = require('./utils/ExpressError')

const app = express()

// Replace with your actual database credentials
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '1354',
    database: 'bookhaven',
}).promise();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs') 
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('__method'))
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig)); // Remove the () after sessionConfig
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(
    async (email, passkey, done) => {
        try {
            console.log("wtf");
            const [rows] = await pool.query(`SELECT * FROM Customer WHERE email = ${email}`);
            const user = rows[0];
            if (!user || user.passkey !== passkey) {
                console.log('Invalid username or password');
                return done(null, false);
            }
            // if(username === 'admin1' && passkey === '123456')
            console.log('User: ', user)
            return done(null, user);
        } catch (error) {
            console.log('Error: ', error);
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        const user = rows[0];
        done(null, user);
    } catch (error) {
        done(error);
    }
});


app.get('/', (req, res) => {
    res.render('home')
} )

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async (req, res, next) =>{
    try{
        //write code to make a new entry in sql table to register 

    }catch(err){
        req.flash('error', err.message);
        res.redirect('register')
    }
} )


app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/browse-books',
    failureRedirect: '/',
}));


app.get('/browse-books',   async (req, res, next) => {

    try{
        const [rows] = await pool.query('SELECT * FROM book');
        const data = rows;
        res.render('browse-books', { data });
    }
    catch(err){
        // next(new ExpressError('No Books Found', 400))
        console('Error: ', err)
    }
})

app.get('/addtocart/:bookId', isLoggedIn, async (req, res, next) => {
    const { bookId } = req.params;
    const customerId = req.user.id;

    try {
        await pool.query('INSERT INTO cart (book_id, customer_id) VALUES (?, ?)', [bookId, customerId]);
        req.flash('success', 'Book added to cart successfully.');
        res.redirect('/browse-books');
    } catch (error) {
        next(error);
    }
});

app.post('/addtocart/#book_id', (req, res) =>{
    //sql query
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

// const mysql = require('mysql2')

// const pool = mysql.createPool({
//     host: '127.0.0.1',
//     user: 'root',
//     password: '1354',
//     database: 'bookhaven',
// }).promise();

// async function  getNotes(){
//     const [rows] = await pool.query('select * from Customer')
//     return rows
// }

// async function main(){
//     const notes = await getNotes()
//     console.log(notes)
// }

// main()
