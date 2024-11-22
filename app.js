const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');
// const bodyParser = require('body-parser');
// const projectRoutes = require('../routes/projectRoutes');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));

// Route: Display the form to add a project

app.get('/', (req, res) => {
    res.render('index');
});



app.get('/addProject', (req, res) => {
    res.render('add-project');
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

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '227806', // Your MySQL password
    database: 'project_tracking_db',
});

const PORT = 5000;
app.listen(PORT, ()=>{
    console.log(`server is running on http://localhost:${PORT}`);
    
})