const path = require("path");
const express = require("express");
//const session = require("express-session");
const fs = require('fs');
const cookieParser = require("cookie-parser");

const app = express();
const port = 5000;
let loggedIn = false;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    // console.log("middleware=>");
    // console.log( req.cookies.user_id);
    const userId = req.cookies.user_id;
    if (userId) {
        fs.readFile(path.join(__dirname, 'usersData.json'), 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading data:", err);
                return res.status(500).send("Error reading data");
            }
            let users = JSON.parse(data);
            // console.log(users);
            let user = users.find(u => u.id == (req.cookies.user_id));
            // let temp=users.filter(u=>u.id==userId)
            // console.log(29,temp);

            //console.log(user);
            if (user) {
                req.cookies.user_id = user.id;
                next();
            }
            else {
                console.log("i destroyed cookie");
                res.clearCookie('user_id');
                res.redirect("/login");
            }
        });
    }
    else {
        next();
    }
});

app.get("/", (req, res) => {
    // console.log("todo=>");
    // console.log(req.cookies.user_id);

    if (req.cookies.user_id) {
        loggedIn = true;
        res.sendFile(__dirname + "/public/todo/index.html");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/script.js", function (req, res) {
    res.sendFile(__dirname + "/public/script.js");
})

app.get("/style.css", function (req, res) {
    res.sendFile(__dirname + "/public/style.css");
})

app.get("/login", function (req, res) {
    if (!loggedIn)
        res.sendFile(__dirname + "/public/login/index.html");
    else {
        res.redirect("/");
    }
});

app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/public/signup/index.html");
});
app.post("/signup", function (req, res) {
    const userData = req.body;
    fs.readFile(path.join(__dirname, 'usersData.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let users = data.length === 0 ? [] : JSON.parse(data);
        let filteredUsers = users.filter(u => u.UserID === userData.UserID);
        if (filteredUsers.length > 0) {
            return res.status(400).send("User already exists");
        }
        const id = Date.now() - Math.random();
        userData.id = id;
        users.push(userData);
        fs.writeFile(path.join(__dirname, 'usersData.json'), JSON.stringify(users), (err) => {
            if (err) {
                return res.status(500).send("Error writing data");
            }
            res.redirect("/login");
        });
    });
});

app.post("/login", (req, res) => {
    const { UserID, password } = req.body;
    fs.readFile(path.join(__dirname, 'usersData.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let users = JSON.parse(data);
        let user = users.find(u => u.UserID === UserID);

        if (user && user.password === password) {
            const id = user.id;
            res.cookie('user_id', id, {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: false,
                path: "/"
            });
            // console.log("login=>")
            // console.log(req.cookies.user_id);
            res.redirect("/");
        }
        else {
            // alert("Check your details again ");
            res.status(401).send("Invalid credentials");
        }
    });
});

app.get('/gettodo', (req, res) => {
    const userId = req.cookies.user_id;
    if (!userId) {
        return res.status(401).send("Unauthorized user");
    }
    fs.readFile(path.join(__dirname, 'data.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let tasks = JSON.parse(data);
        let userTasks = tasks[userId] || [];
        res.json(userTasks);
    });
});

app.post("/savetodo", (req, res) => {
    const userId = req.cookies.user_id;
    if (!userId) {
        return res.status(401).send("Unauthorized user");
    }
    fs.readFile(path.join(__dirname, 'data.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let tasks = JSON.parse(data);
        if (!tasks[userId]) {
            tasks[userId] = [];
        }
        let newTask = req.body;
        tasks[userId].push(newTask);
        fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(tasks), (err) => {
            if (err) {
                return res.status(500).send("Error writing data");
            }
            res.json(newTask);
        });
    });
});


app.put('/updateCounter/:id', (req, res) => {
    const userId = req.cookies.user_id;
    if (!userId) {
        return res.status(401).send("Unauthorized");
    }
    const taskId = parseInt(req.params.id);
    const counter = req.body.counter;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let tasks = JSON.parse(data);
        let userTasks = tasks[userId] || [];
        let task = userTasks.find(t => t.id === taskId);
        if (task) {
            task.counter = counter;
            fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(tasks), (err) => {
                if (err) {
                    return res.status(500).send("Error writing data");
                }
                res.status(200).send("Task updated successfully");
            });
        } else {
            res.status(404).send("Task not found");
        }
    });
});

app.put('/updatetask/:id', (req, res) => {
    const userId = req.cookies.user_id;
    if (!userId) {
        return res.status(401).send("Unauthorized");
    }
    const taskId = parseInt(req.params.id);
    const updatedData = req.body;
    fs.readFile(path.join(__dirname, 'data.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let tasks = JSON.parse(data);
        let userTasks = tasks[userId] || [];
        let task = userTasks.find(t => t.id === taskId);
        if (task) {
            if (updatedData.counter !== undefined) {
                task.counter = updatedData.counter;
            }
            if (updatedData.task !== undefined) {
                task.task = updatedData.task;
            }
            fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(tasks), (err) => {
                if (err) {
                    return res.status(500).send("Error writing data");
                }
                res.status(200).send("Task updated successfully");
            });
        } else {
            res.status(404).send("Task not found");
        }
    });
});

app.delete("/deletetodo/:id", (req, res) => {
    const userId = req.cookies.user_id;
    if (!userId) {
        return res.status(401).send("Unauthorized");
    }
    const taskId = parseInt(req.params.id);
    fs.readFile(path.join(__dirname, 'data.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data");
        }
        let tasks = JSON.parse(data);
        let userTasks = tasks[userId] || [];
        tasks[userId] = userTasks.filter(todo => todo.id !== taskId);
        fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(tasks), (err) => {
            if (err) {
                return res.status(500).send("Error writing data");
            }
            res.send("Success");
        });
    });
});

app.listen(port, () => {
    console.log(`Server is starting on port ${port}\n`);
});

app.get("/logout", (req, res) => {
    loggedIn = false;
    res.clearCookie('user_id');
    res.redirect('/login');
});