# Recipe API

## Description
This is a Recipe API that allows users to create, view, filter, and comment on recipes. It provides endpoints for user registration, authentication, and recipe management.

## Requirements
- Node.js version 18
- MongoDB (for the database)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/anilkumarswain140/RecipeAppBackend.git
   cd https://github.com/anilkumarswain140/RecipeAppBackend.git
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
  - **Endpoint:** `POST /api/v1/auth/register`
  - **Body:** 
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```

- **Login a user**
  - **Endpoint:** `POST /api/v1/auth/login`
  - **Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```

### Recipes

- **Create a new recipe**
  - **Endpoint:** `POST /api/v1/recipes`
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
  - **Endpoint:** `GET /api/v1/recipes`
  - **Query Params:**
    - `ingredients`: string (optional)
    - `rating`: number (optional)
    - `preparationTime`: number (optional)
    - `page`: number (default: 1)
    - `limit`: number (default: 10)
    - `search`: string (optional)

- **Get a single recipe by ID**
  - **Endpoint:** `GET /api/v1/recipes/:id`

- **Rate a recipe**
  - **Endpoint:** `POST /api/v1/recipes/:id/rate`
  - **Body:**
    ```json
    {
      "value": number
    }
    ```

### Comments

- **Add a comment to a recipe**
  - **Endpoint:** `POST /api/v1/comments`
  - **Body:**
    ```json
    {
      "recipeId": "string",
      "content": "string"
    }
    ```

- **Get comments for a recipe**
  - **Endpoint:** `GET /api/v1/comments/:recipeId`




# Authentication Controller Functions Documentation

## 1. Register a New User

**Function Name**: `register`

### Purpose:
Handles the registration of a new user. It validates the request, checks if the user already exists, hashes the password, and then creates the user in the database.

### Code:
```javascript
const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        let user = await User.findOne({ $or: [{ username }, { email }] });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = await User.create({
            username,
            email,
            password,
        });

        res.status(201).json({
            user: {
                id: user._id,
                username,
                email
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
```

### Explanation:
- **Input Validation**: Checks if all fields are provided, if the email is in a valid format, and if the password meets the length requirement.
- **Database Check**: Ensures that the user doesn’t already exist based on the username or email.
- **Password Hashing**: Password is hashed before storing in the database.
- **Error Handling**: Handles errors for missing fields, invalid data, existing users, and server issues.
- **Response**: Responds with a success message and user details if successful, or an error message if failed.

---

## 2. Authenticate User & Get Token

**Function Name**: `login`

### Purpose:
Authenticates the user using their email and password, and if successful, generates a JWT token for access.

### Code:
```javascript
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
```

### Explanation:
- **Input Validation**: Ensures that both email and password are provided.
- **User Lookup**: Searches for the user by email and checks if the password matches.
- **Token Generation**: If authentication is successful, a JWT token is generated using the user’s ID.
- **Error Handling**: Handles errors for missing data, invalid credentials, and server issues.
- **Response**: Returns the JWT token and user details on successful login, or an error message on failure.

---

## Summary of Error Handling and Flow:

### Error Handling:
1. **Bad Request (400)**: Common when the user provides incorrect or missing input such as invalid credentials, missing fields, or invalid email format.
2. **Server Error (500)**: A fallback for unexpected errors such as database issues or server problems.

### Flow:
1. **Registration**:
   - Validate input fields.
   - Check if the user already exists.
   - Create a new user if valid.
   - Return the user data on success or an error message on failure.

2. **Login**:
   - Validate input fields.
   - Check user credentials.
   - Generate a JWT token if the user is authenticated.
   - Return the user data and token or an error message.



# Comments Controller Functions Documentation

## 1. Add a Comment to a Recipe

**Function Name**: `addComment`

### Purpose:
Handles the addition of a comment to a specific recipe. It validates the input, ensures the recipe exists, and then creates the comment linked to the recipe.

### Code:
```javascript
const addComment = async (req, res) => {
  const { recipeId, content } = req.body;

  // Check for valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return res.status(400).json({ message: 'Invalid recipe ID format' });
  }

  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const comment = await Comment.create({
      recipe: recipeId,
      author: req.user._id,
      content,
    });

    recipe.comments.push(comment._id);
    await recipe.save();

    res.status(201).json(comment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', details: error.errors });
    } else {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

### Explanation:

- **Input Validation**: Ensures the `recipeId` is in a valid format and that the `content` is provided.
- **Recipe Check**: Verifies if the recipe exists in the database. If the recipe is not found, a `404` error is returned.
- **Comment Creation**: If the recipe exists, a new comment is created with the `recipeId`, `userId` (from `req.user`), and `content`.
- **Recipe Update**: The comment is added to the recipe’s `comments` array, and the recipe is saved.
- **Error Handling**: Handles validation errors, server errors, and issues with missing recipes.
- **Response**: On success, it returns the created comment; on failure, it returns an error message.



const getComments = async (req, res) => {
  const { recipeId } = req.params;

  // Check for valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return res.status(400).json({ message: 'Invalid recipe ID format' });
  }

  try {
    const comments = await Comment.find({ recipe: recipeId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

## Summary of Error Handling and Flow

### Error Handling:
- **Bad Request (400)**: Occurs when the `recipeId` is invalid, or required fields are missing.
- **Not Found (404)**: Returned when the specified recipe cannot be found in the database.
- **Server Error (500)**: A fallback for unexpected errors such as database issues or server problems.

### Flow:

#### Adding a Comment:
1. Validate input fields (`recipeId` and `content`).
2. Check if the recipe exists in the database.
3. Create a new comment and associate it with the recipe.
4. Save the comment and update the recipe’s comments array.
5. Return the comment or an error message.

#### Getting Comments:
1. Validate the `recipeId`.
2. Fetch all comments for the recipe.
3. Populate the `author` field with the username.
4. Return the list of comments or an error message.


## License
This project is licensed under the MIT License.
