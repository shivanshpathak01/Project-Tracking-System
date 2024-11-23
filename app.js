const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // For password hashing
const session = require('express-session'); // For session management
const multer = require('multer'); // For handling file uploads
const path = require('path');
const app = express();
const fs = require('fs');

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Middleware: Setup Session
app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
    })
);

// Database Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '227806',
    database: 'project_tracking_db',
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

// Middleware: File Upload Setup

//half working -- old
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     },
// });

// Set up multer for file uploading
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir); // Create the directory if it doesn't exist
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to the filename
    }
});

const upload = multer({ storage: storage });

// Route to show file upload form (optional if you want a separate page for upload)
app.get('/uploadFile', (req, res) => {
    res.render('uploadFile');
});

// Route to handle file upload
app.post('/uploadFile', upload.single('file'), (req, res) => {
    if (req.file) {
        // After successful upload, you can save the file info to a database
        // For now, we're just redirecting back to the dashboard with a success message
        res.redirect('/dashboard'); // Or wherever you'd like to show the uploaded files
    } else {
        res.send('Error uploading file.');
    }
});






// Routes
// Primary Route
app.get('/', (req, res) => {
    res.render('index');
});


// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Signup Page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';

    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Internal server error');
        }
        if (results.length === 0) {
            return res.send('Invalid email or password');
        }
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                req.session.user = user; // Save user in session
                res.redirect('/addProject');
            } else {
                res.send('Invalid email or password');
            }
        });
    });
});

// Signup Route
// Old -- working 

// app.post('/signup', async (req, res) => {
//     const { name, email, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

//     connection.query(query, [name, email, hashedPassword], (err) => {
//         if (err) {
//             console.error('Error signing up user:', err);
//             return res.status(500).send('Error signing up');
//         }
//         res.redirect('/login');
//     });
// });

// new 

// Signup Route
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    connection.query(checkQuery, [email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            return res.status(400).send('User already exists. Please log in.');
        }

        // Insert new user
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        connection.query(query, [name, email, password], (err, result) => {
            if (err) throw err;

            // Automatically log in the user after signup
            req.session.user = {
                id: result.insertId,
                name,
                email,
            };
            res.redirect('/dashboard'); // Redirect to dashboard
        });
    });
});



// Home Route
app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('home', { user: req.session.user });
});



// Add a new Project by rendering a form 
app.get('/addProject', (req, res) => {
    res.render('addProject');
});
// Route: Add a new project to the database
// app.post('/addProject', (req, res) => {
//     const { name, description, start_date, end_date } = req.body;
//     const query = `INSERT INTO projects (name, description, start_date, end_date) VALUES (?, ?, ?, ?)`;

//     connection.query(query, [name, description, start_date, end_date], (err) => {
//         if (err) {
//             console.error('Error adding project:', err);
//             return res.status(500).send('Error adding project');
//         }
//         res.redirect('/getAllProjects');
//     });
// });

// Add a New Project Route
app.post('/addProject', (req, res) => {
    // Ensure the user is logged in
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { name, description, start_date, end_date } = req.body;
    const userId = req.session.user.id; // Retrieve user ID from session

    // Updated query to include user_id
    const query = `INSERT INTO projects (name, description, start_date, end_date, user_id) VALUES (?, ?, ?, ?, ?)`;

    connection.query(query, [name, description, start_date, end_date, userId], (err) => {
        if (err) {
            console.error('Error adding project:', err);
            return res.status(500).send('Error adding project');
        }

        res.redirect('/dashboard'); // Redirect to the user's dashboard
    });
});




// Route: Fetch and display all projects
app.get('/getAllProjects', (req, res) => {
    const query = `SELECT * FROM projects`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching projects:', err);
            return res.status(500).send('Error fetching projects');
        }
        res.render('getAllProjects', { projects: results });
    });
});



// Delete Route 
app.get('/deleteProjects',(req,res)=>{
    res.redirect('getAllProjects');
})

const promisePool = connection.promise();

app.post('/projects/delete/:id', async (req, res) => {
    try {
        const userId = req.params.id; // Get user ID from URL parameter
        const query = 'DELETE FROM projects WHERE id = ?';
        await promisePool.query(query, [userId]);

        await promisePool.query('SET @new_id = 0;');
        await promisePool.query('UPDATE projects SET id = (@new_id := @new_id + 1);');
        await promisePool.query('ALTER TABLE projects AUTO_INCREMENT = 1;');

        res.redirect('/getAllProjects'); // Redirect back to the users table
    } catch (err) {
        console.error('Error deleting project:', err.message);
        res.status(500).send('Error deleting project');
    }
});



// Route: Dashboard (Display User's Files)
// Dashboard Route
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
    }

    const userId = req.session.user.id; // Get the logged-in user's ID
    const query = 'SELECT * FROM projects WHERE user_id = ?';

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user projects:', err);
            return res.status(500).send('Error fetching user projects');
        }

        // Render the dashboard with the user's projects
        res.render('dashboard', {
            user: req.session.user, // Pass the logged-in user's data
            projects: results, // Pass the user's projects
        });
    });
});




// Route: Upload File
// Old -- working
// app.post('/upload', upload.single('file'), (req, res) => {
//     if (!req.session.user) {
//         return res.redirect('/login');
//     }
//     const userId = req.session.user.id;
//     const fileName = req.file.filename;
//     const query = 'INSERT INTO user_files (user_id, file_name) VALUES (?, ?)';

//     connection.query(query, [userId, fileName], (err) => {
//         if (err) {
//             console.error('Error uploading file:', err);
//             return res.status(500).send('Error uploading file');
//         }
//         res.redirect('/dashboard');
//     });
// });



// Route: Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});





// Port Setup
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
