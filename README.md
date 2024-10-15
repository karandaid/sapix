# **Sapix Library Documentation**  

**SAPIX**: **S**imple **A**PI **P**rocessing and **I**ntegration e**X**perience  

Welcome to **Sapix**, a lightweight library designed to help you build robust servers with intuitive routing. This documentation provides examples and instructions to get you started using **Sapix** effectively.

---

## **Installation**  

Install **Sapix** via npm:  
```bash
npm install sapix
```

---

## **Usage Overview**

Below is an example of setting up a server using **Sapix** and configuring multiple routes with different HTTP methods.

---

### **Step-by-Step: Create Routes with Sapix**

#### **GET `/` – Home Route**  
```javascript
routes.get('/', (res) => {
    res.status(200).sendText('Welcome to sapixRoutes Home Page!');
});
```
- **Purpose**: Handles the homepage request and responds with text.  
- **Response**:
  ```
  Welcome to sapixRoutes Home Page!
  ```

#### **GET `/profile/:id/user/:userId` – Dynamic Route with Params**  
```javascript
routes.get('/profile/:id/user/:userId', (res, query, path_params) => {
    res.status(200).sendJSON({ 
        message: 'This is a JSON response.', 
        query, 
        path_params 
    });
});
```
- **Purpose**: Responds with JSON including query and path parameters.  
- **Example Request**:  
  ```
  GET /profile/1/user/456?status=active
  ```
- **Example Response**:
  ```json
  {
    "message": "This is a JSON response.",
    "query": { "status": "active" },
    "path_params": { "id": "1", "userId": "456" }
  }
  ```

---

## **HTTP Method Examples**

#### **POST `/profile` – Create User Profile**  
```javascript
routes.post('/profile', (res) => {
    res.status(200).sendJSON({ message: 'Profile created successfully.' });
});
```
- **Purpose**: Responds to `POST` requests with a confirmation message.  
- **Response**:
  ```json
  { "message": "Profile created successfully." }
  ```

#### **DELETE `/profile` – Delete User Profile**  
```javascript
routes.delete('/profile', (res) => {
    res.status(200).sendJSON({ message: 'Profile deleted successfully.' });
});
```
- **Purpose**: Responds with a message confirming deletion.  
- **Response**:
  ```json
  { "message": "Profile deleted successfully." }
  ```

#### **PATCH `/profile` – Update User Profile**  
```javascript
routes.patch('/profile', (res) => {
    res.status(200).sendJSON({ message: 'Profile updated successfully.' });
});
```
- **Purpose**: Responds with a message confirming the profile update.  
- **Response**:
  ```json
  { "message": "Profile updated successfully." }
  ```

---

## **Additional Routes**

#### **GET `/about` – About Page**  
```javascript
routes.get('/about', (res) => {
    res.status(200).sendHTML('<h1>Welcome to the About Page!</h1>');
});
```
- **Purpose**: Sends an HTML response for the "About" page.  
- **Response**:
  ```html
  <h1>Welcome to the About Page!</h1>
  ```

#### **GET `/error` – Error Handling**  
```javascript
routes.get('/error', (res) => {
    res.sendError('An unexpected error occurred.', 500);
});
```
- **Purpose**: Simulates a server error response.  
- **Response**:
  ```json
  { "error": "An unexpected error occurred." }
  ```

---

## **Starting the Sapix Server**

Once your routes are defined, start the server using the following code:

```javascript
import { sapixServer, sapixRoutes } from 'sapix';

// Create routes
const routes = new sapixRoutes();

// Start the server
const server = new sapixServer()
    .setPort(4000)    // Specify the port
    .setRoute(routes) // Attach the routes
    .start();         // Start the server
```

Your server will now be running at `http://localhost:4000`.

---

## **Key Features of Sapix**

1. **S**imple: Easy to configure with minimal setup.  
2. **A**PI-oriented: Focused on building APIs efficiently.  
3. **P**rocessing-friendly: Handles different HTTP methods (GET, POST, PATCH, DELETE).  
4. **I**ntegrated: Supports dynamic routes, query params, and path params.  
5. **X**perience-first: Provides error handling and a smooth developer experience.

---

## **Project Structure**

```
├── index.js           // Main server script
└── package.json       // Project metadata and dependencies
```

---

## **How to Test**

- **GET Request**:  
  Visit `http://localhost:4000/profile/1/user/456` in your browser or Postman.
  
- **POST Request**:  
  Send a `POST` request to `http://localhost:4000/profile` with an appropriate payload.

---

## **Error Handling**

Use `sendError` to return error responses:

```javascript
routes.get('/error', (res) => {
    res.sendError('Something went wrong!', 500);
});
```

---

## **Feedback & Contribution**

Feel free to contribute to this project by submitting pull requests or opening issues.

---

## **License**

This project is licensed under the **MIT License**.

---

Enjoy the **Simple API Processing and Integration eXperience** with Sapix! 🚀