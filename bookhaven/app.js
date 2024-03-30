const express = require('express')
const session = require('express-session')
const mysql = require('mysql2/promise')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const passport = require('passport')
const passport_local = require('passport-local')

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
});

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

app.use(session(sessionConfig()))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(
    async (username, passkey, done) => {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            const user = rows[0];
            if (!user || user.passkey !== passkey) {
                return done(null, false);
            }
            // if(username === 'admin' && passkey === '123456')

            return done(null, user);
        } catch (error) {
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

app.get('login', (req, res) => {
    res.render('login')
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/browse-books',
    failureRedirect: '/login',
}));


app.get('/book',  (req, res, next) => {

    try{
        const [rows] = pool.query('SELECT * FROM book');
        const data = rows;
        res.render('browse-books', { data });
    }
    catch{
        next(new ExpressError('No Books Found', 400))
    }
})

app.get('')







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