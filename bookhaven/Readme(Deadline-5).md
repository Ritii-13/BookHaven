# Embedded SQL Queries in BookHaven Application

## Overview
This README provides a summary of the embedded SQL queries used in the BookHaven application. These queries interact with the MySQL database to perform various operations such as user authentication, registration, cart management, and book browsing.

## Queries

### User Authentication and Registration
1. **Local Strategy Authentication**
    - **Purpose:** Authenticates users using local strategy (email and passkey).
    - **Query:** `SELECT * FROM Customer WHERE email=? AND passkey=?`

2. **User Registration**
    - **Purpose:** Registers a new user into the database.
    - **Query:** 
    ```sql
    INSERT INTO customer (first_name, last_name, pincode, address, contact, date_of_birth, email, passkey, amount, owned_books)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ```

### Admin Operations
1. **Admin Login**
    - **Purpose:** Allows an admin to log in.
    - **Query:** `SELECT * FROM Admin WHERE username=? AND passkey=?`
2. **Inventory and Customer Management**
    - **Purpose:** Retrieves all customers and books from the database.
    - **Query:** 
    ```sql
    SELECT * FROM customer;
    SELECT * FROM book;
    ```

### Book Operations
1. **Browse Books**
    - **Purpose:** Retrieves all books from the database for browsing.
    - **Query:** `SELECT * FROM book`

### Cart Management
1. **Add Book to Cart**
    - **Purpose:** Adds a book to the user's cart.
    - **Query:** `CALL insert_or_update_cart_item (?, ?)`
    - **Note:** This is a stored procedure to insert or update cart items.

2. **View Cart**
    - **Purpose:** Retrieves all items in the user's cart.
    - **Query:** 
    ```sql
    SELECT book.book_name, book.author_name, book.genre, book.price, cart_items.count
    FROM cart_items
    JOIN book ON cart_items.book_id = book.book_id
    WHERE cart_items.cart_id = ?
    ```

## Conclusion
This document provides an overview of the embedded SQL queries used in the BookHaven application. These queries facilitate various functionalities such as user authentication, registration, admin operations, book browsing, and cart management. Many more queries have been used and will be used further along the development of the application.
