const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));

// Primary Route 
app.get('/', (req, res) => {
    res.render('index');
});


// Home Route 
app.get('/home', (req, res) => {
    res.render('index');
});


// Add a new Project by rendering a form 
app.get('/addProject', (req, res) => {
    res.render('addProject');
});
// Route: Add a new project to the database
app.post('/addProject', (req, res) => {
    const { name, description, start_date, end_date } = req.body;
    const query = `INSERT INTO projects (name, description, start_date, end_date) VALUES (?, ?, ?, ?)`;

    connection.query(query, [name, description, start_date, end_date], (err) => {
        if (err) {
            console.error('Error adding project:', err);
            return res.status(500).send('Error adding project');
        }
        res.redirect('/getAllProjects');
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

// Connecting to the Database 
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '227806', // Your MySQL password
    database: 'project_tracking_db',
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



// Port 
const PORT = 5000;
app.listen(PORT, ()=>{
    console.log(`server is running on http://localhost:${PORT}`);
    
})