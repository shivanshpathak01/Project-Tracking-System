// Function to add a project
function addProject() {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;

    // Basic form validation
    if (!name || !description) {
        alert('Please enter both name and description');
        return;
    }

    // Send the data to the backend to add the project
    fetch('http://localhost:3306/projects/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show success message
        getAllProjects(); // Refresh the project list
        document.getElementById('projectName').value = ''; // Clear form inputs
        document.getElementById('projectDescription').value = '';
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to get all projects from the backend
function getAllProjects() {
    fetch('http://localhost:3306/projects')
    .then(response => response.json())
    .then(data => {
        const projectList = document.getElementById('projectList');
        projectList.innerHTML = ''; // Clear current list

        if (data.length === 0) {
            projectList.innerHTML = 'No projects found.';
            return;
        }

        // Display all projects
        data.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.classList.add('project');

            projectDiv.innerHTML = `
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <button onclick="deleteProject(${project.id})">Delete</button>
            `;
            projectList.appendChild(projectDiv);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to delete a project
function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        fetch(`http://localhost:5000/projects/delete/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            getAllProjects(); // Refresh the project list after deletion
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}