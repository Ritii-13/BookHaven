const express = require('express')
const session = require('express-session')
const expressflash = require('express-flash')
const mysql = require('mysql2')
const ejsMate = require('ejs-mate')
const methodOverride = require('method-override')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const path = require('path');
const flash = require('connect-flash');
// const LocalStrategy = require('passport-local').Strategy;


const ageValidation = require('./utils/ageValidation')
// const isLoggedIn = require('./utils/isLoggedIn')
const ExpressError = require('./utils/ExpressError')
const { PoolConnection } = require('mysql2/typings/mysql/lib/PoolConnection')

const app = express()
app.use(flash())

// Replace with your actual database credentials
const pool = mysql.createPool({
    host: 'localhost',
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
            const [rows] = await pool.query('SELECT * FROM Customer WHERE email = ? AND passkey = ?', [email, passkey]);
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
    try{    console.log(req.body);
        const { first_name, last_name, pincode, address, contact, dob,email, passkey } = req.body;
        if (!first_name || !last_name || !pincode || !address || !contact || !dob || !email || !passkey) {
            console.log('Please fill in all required fields.');
        }

        pool.query('INSERT INTO customer (first_name, last_name, pincode, address, contact, date_of_birth, email, passkey, amount, owned_books) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                [first_name, last_name, pincode, address, contact, dob, email, passkey, 0, null], (error, results, fields) => {
        if (error) {
            // Handle error after the release.
                    console.error('Error occurred during the database operation:', error);
                    return res.redirect('/register');
                }
  // Use results and fields if necessary.
        console.log('Registration successful');
});

        return res.redirect('/customer/login'); 
    }catch(err){
        req.expressflash('error', err.message);
        return res.redirect('/register');
    }
});



app.get('/customer/login', (req, res) => {
    res.render('login')
})

let isLoggedIn = false

app.post('/customer/login', async(req, res, next) => {
    try{
        const {email, passkey} = req.body
        const [rows] = await pool.query('SELECT * FROM Customer WHERE email=? AND passkey=?', [email, passkey])
        if(rows.length === 0){
            // req.expressflash('error', 'incorrect credentials')
            // alert('incorrect credentials')
            return res.redirect('/customer/login')
        }

        isLoggedIn = true
        req.session.isLoggedIn = true

        const user = rows[0]
        const serializedUser = {
            id: user.customer_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            passkey: user.passkey,
            date_of_birth: user.date_of_birth,
        }

        req.session.user = serializedUser;
        console.log(req.session.user)

        // alert(Welcome back, ${user.first_name}!)
        req.expressflash('success', `Welcome, ${req.session.user.first_name}`)
        setTimeout( () => {
            res.redirect('/browse-books')
        }, 1000 )
    }catch(err){
        console.log('Catch ka Error:-> ', err)
        next(err)
    }
} )

app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false
    req.session.user = null
    req.expressflash('success', 'Successfully Logged Out!')
    setTimeout( () => {
        res.redirect('/')
    }, 1000 )
})

app.get('/admin/login', (req, res) => {
    res.render('admin-login')
})

app.post('/admin/login', async (req, res, next) => {
    try{
        const {username, passkey} = req.body
        const [rows] = await pool.query('SELECT * FROM Admin WHERE username=? AND passkey=?', [username, passkey])
        if(rows.length === 0){
            // req.expressflash('error', 'incorrect credentials')
            // alert('incorrect credentials')
            return res.redirect('/admin/login')
        }
        req.expressflash('success', 'Admin login successful')
        setTimeout( () => {
            res.redirect('/admin-dashboard')
        }, 1000 )
        // console.log('Admin Logged In')
    }catch(err){
        console.log('Catch ka Error:-> ', err)
        next(err)
    }
});

app.get('/admin-dashboard', async (req, res) => {
    // render the admin dashboard view
    try{
        const [rows] = await pool.query('SELECT * FROM book');
        const data1 = rows;
        const [rows1] = await pool.query('SELECT * FROM customer');
        const data2 = rows1;

        res.render('admin-dashboard', { data1, data2 });
    }
    catch(err){
        // next(new ExpressError('No Books Found', 400))
        console.log('Error: ', err)
    }

});



app.get('/browse-books',   async (req, res, next) => {
    // console.log(req.session.user)
    try{
        const [rows] = await pool.query('SELECT * FROM book');
        const data = rows;
        res.render('browse-books', { data });
    }
    catch(err){
        // next(new ExpressError('No Books Found', 400))
        console.log('Error: ', err)
    }

});


app.post('/addtocart/:book_id', async(req, res) =>{
    if(req.session.isLoggedIn){
        const {book_id} = req.params;
        const user = req.session.user
        console.log('User: ', user)
        try{
            const [rows] = await pool.query('SELECT cart_id FROM cart WHERE customer_id = ?', [user.id]);
            const cartId = rows[0].cart_id;
    
            // Insert the book id for the cart id in the cart items table
            await pool.query('CALL insert_or_update_cart_item (?, ?)', [cartId, book_id]);
            console.log('Added to cart');
            res.redirect('/browse-books')
            
        }catch(err){
            console.log('Error: ', err)
            // alert('Book is out of stock')
            res.redirect('/browse-books')
        }
    }else{
        res.redirect('/')
    }
    
})

app.get('/cart', async (req, res) => {
    if(req.session.isLoggedIn){
        const user = req.session.user
        console.log('User: ', user)
        try{
            const [rows] = await pool.query('SELECT cart_id FROM cart WHERE customer_id = ?', [user.id]);
            const cartId = rows[0].cart_id;
            const [rows1] = await pool.query(`
                SELECT book.book_name, book.author_name, book.genre, book.price, cart_items.count
                FROM cart_items
                JOIN book ON cart_items.book_id = book.book_id
                WHERE cart_items.cart_id = ?
            `, [cartId]);
            const data = rows1;
            let totalItems = 0;
            let totalPrice = 0;
            data.forEach(item => {
                totalItems += item.count;
                totalPrice += item.count * item.price;
            });
            res.render('cart', { data: data, totalItems: totalItems, totalPrice: totalPrice });
        }catch(err){
            console.log('Error: ', err)
            res.redirect('/browse-books')
        }
    }else{
        res.redirect('/')
    }
});

app.get('/manage-inventory', (req, res) => {
    res.render('manage-inventory');
});

app.post('/manage-inventory/add', async (req, res) => {
    const { bookId, quantity } = req.body;
    try {
        await pool.query('UPDATE book SET stock = stock + ? WHERE book_id = ?', [quantity, bookId]);
        res.redirect('/manage-inventory');
    } catch (error) {
        console.error('Error adding quantity to inventory:', error);
    }
});

app.post('/manage-inventory/subtract', async (req, res) => {
    const { bookId, quantity } = req.body;
    try {
        const [book] = await pool.query('SELECT stock FROM book WHERE book_id = ?', [bookId]);
        const currentStock = book[0].stock;
        if (currentStock - quantity >= 0) {
            await pool.query('UPDATE book SET stock = stock - ? WHERE book_id = ?', [quantity, bookId]);
        } else {
            console.log('Error: Quantity to subtract exceeds current stock!');
        }
        res.redirect('/manage-inventory');
    } catch (error) {
        console.error('Error subtracting quantity from inventory:', error);
    }
});

app.get('/manage-customers', (req, res) => {
    res.render('manage-customers');
});

app.post('/manage-customers/subtract', async (req, res) => {
    const { customer_id } = req.body;
    try {
        await pool.query('DELETE FROM browses WHERE customer_id = ?', [customer_id]);
        await pool.query('DELETE FROM cart_items WHERE cart_id = (SELECT cart_id FROM cart WHERE customer_id = ?)', [customer_id]);
        await pool.query('DELETE FROM cart WHERE customer_id = ?', [customer_id]);
        await pool.query('DELETE FROM customer_analysis WHERE customer_id = ?', [customer_id]);
        await pool.query('DELETE FROM `order` WHERE customer_id = ?', [customer_id]);
        await pool.query('DELETE FROM customer WHERE customer_id = ?', [customer_id]);
        res.redirect('/manage-customers');
    } catch (error) {
        console.error('Error deleting customer', error);
    }
});

app.get('/checkout', async (req, res) => {
    if(req.session.isLoggedIn){
        const user = req.session.user
        console.log('User: ', user)
        try{
            const [rows] = await pool.query('SELECT cart_id FROM cart WHERE customer_id = ?', [user.id]);
            const cartId = rows[0].cart_id;
            const [rows1] = await pool.query(`
                SELECT book.book_id, book.price, book.stock, book.book_name, cart_items.count
                FROM cart_items
                JOIN book ON cart_items.book_id = book.book_id
                WHERE cart_items.cart_id = ?
            `, [cartId]);
            const data = rows1;
            //for loop with an if
            data.forEach( item => {
                if( item.stock < item.count){
                    req.expressflash('success', `${item.book.book_name} understocked or is out-of-stock!`)
                    setTimeout(() => {
                        res.redirect('/cart')
                    }, 1000)
                }
            } )
            let totalItems = 0;
            let totalPrice = 0;
            data.forEach(item => {
                totalItems += item.count;
                totalPrice += item.count * item.price;
            });

            //initiating transaction
            await pool.query( 'START TRANSACTION; LOCK TABLES order WRITE, cart_items WRITE, book WRITE', (err, result) =>{
                if(err){
                    console.log("Error in transaction stage1: ", err)
                    req.expressflash('error', 'ERROR OCCURED | Transaction failed')
                    setTimeout(() => {
                        res.redirect('/cart')
                    }, 1000)
                }
            } )



            for (let item of data) {
                // Insert items into order table
                await pool.query(`
                    INSERT INTO order (count, price, book_id, customer_id)
                    VALUES (?, ?, ?, ?)
                `, [item.count, item.price, item.book_id, user.id], (err, result) => {
                    if(err){
                        console.log("Error in transaction stage2: ", err)
                        req.expressflash('error', 'ERROR OCCURED | Transaction failed')
                        setTimeout(() => {
                            res.redirect('/cart')
                        }, 1000)
                    }
                });

                // Delete the same items from cart
                await pool.query('DELETE FROM cart_items WHERE book_id = ? AND cart_id = ?', [item.book_id, cartId], (err, result) => {
                    if(err){
                        console.log("Error in transaction stage2: ", err)
                        req.expressflash('error', 'ERROR OCCURED | Transaction failed')
                        setTimeout(() => {
                            res.redirect('/cart')
                        }, 1000)                  
                    }
                });
            
            }

            await pool.query( 'UNLOCK TABLES; COMMIT', async(err, result) => {
                if(err){
                    console.log("Error in transaction stage3: ", err)

                    await pool.query('ROLLBACK', (err, result) => {
                        console.log("ERROR IN ROLLBACK: ", err)
                    })

                    req.expressflash('error', 'ERROR OCCURED | Transaction failed')
                    setTimeout(() => {
                        res.redirect('/cart')
                    }, 1000)                  
                }
            } )

            //after successful transaction
            req.expressflash('success', 'Your order has been placed  ')
            setTimeout(() => {
                res.redirect('/')
            }, 1000) 
        }catch(err){
            await pool.query('ROLLBACK');
            console.log('Error: ', err)
            res.redirect('/cart')
        }
    }else{
        res.redirect('/')
    }
});


app.get('*', (req, res, next) => {
    res.render('no-page')
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


/*
const express = require('express');
const app = express();
const mysql = require('mysql');

// Create connection
const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

// Connect
db.connect((err) => {
  if(err){
      throw err;
  }
  console.log('MySQL Connected...');
});

app.get('/checkout', (req, res) => {
  const sql = "START TRANSACTION; LOCK TABLE table1, table2, table3 IN EXCLUSIVE MODE;";
  db.query(sql, (err, result) => {
    if(err) {
      console.log(err); // Log the error for debugging
      req.expressflash('error', 'Transaction failed');
      res.redirect('/checkout'); // Redirect to checkout page
      return; // Exit the function
    }

    // Your code for successful transaction

    const commitSql = "COMMIT;";
    db.query(commitSql, (err, result) => {
      if(err) {
        console.log(err); // Log the error for debugging
        req.expressflash('error', 'Transaction failed');
        res.redirect('/checkout'); // Redirect to checkout page
        return; // Exit the function
      }
      req.expressflash('success', 'Transaction successful');
      res.redirect('/checkout'); // Redirect to checkout page
    });
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

*/