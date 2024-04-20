# BookHaven
### *Your escape from reality, one book at a time*

## Transaction Analysis

### Non Conflicting transactions

- #### Book Browsing 
  
  Since browsing our collection only requires a _read_ query, this will not be a conflicting action. It is done using the following query

  ```sql
  SELECT * FROM book
  ```
- #### Login
  
  Login only requires checking whether the input credentials are valid or not and is done using the following query

  ```sql
  SELECT * FROM Admin WHERE username=? AND passkey=?
  ```

- #### Cart
  
  _/cart_ display the logged in users
