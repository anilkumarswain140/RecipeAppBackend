# Recipe API

## Description
This is a Recipe API that allows users to create, view, filter, and comment on recipes. It provides endpoints for user registration, authentication, and recipe management.

## Requirements
- Node.js version 18
- MongoDB (for the database)

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application
To start the server, use the following command:
```bash
npm start
```

The application will run on port **3000**.

## API Endpoints

### User Authentication

- **Register a new user**
  - **Endpoint:** `POST /api/auth/register`
  - **Body:** 
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```

- **Login a user**
  - **Endpoint:** `POST /api/auth/login`
  - **Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```

### Recipes

- **Create a new recipe**
  - **Endpoint:** `POST /api/recipes`
  - **Body:**
    ```json
    {
      "title": "string",
      "ingredients": ["string"],
      "steps": "string",
      "image": "string",
      "preparationTime": "number"
    }
    ```

- **Get all recipes with filters and pagination**
  - **Endpoint:** `GET /api/recipes`
  - **Query Params:**
    - `ingredients`: string (optional)
    - `rating`: number (optional)
    - `preparationTime`: number (optional)
    - `page`: number (default: 1)
    - `limit`: number (default: 10)
    - `search`: string (optional)

- **Get a single recipe by ID**
  - **Endpoint:** `GET /api/recipes/:id`

- **Rate a recipe**
  - **Endpoint:** `POST /api/recipes/:id/rate`
  - **Body:**
    ```json
    {
      "value": number
    }
    ```

### Comments

- **Add a comment to a recipe**
  - **Endpoint:** `POST /api/comments`
  - **Body:**
    ```json
    {
      "recipeId": "string",
      "content": "string"
    }
    ```

- **Get comments for a recipe**
  - **Endpoint:** `GET /api/comments/:recipeId`

## License
This project is licensed under the MIT License.
