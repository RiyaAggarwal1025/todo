let task = document.getElementById("task");
let submit = document.getElementById("submit");
let list = document.getElementById("list");

getTodo(function(todos) {
    todos.forEach(function(todo) {
        let value = todo.task;
        mytasklist(value, todo.id, todo.counter);
    });
});

function mytasklist(value, id, counter) {
    let div = document.createElement('div');
    div.classList.add("div");
    let li = document.createElement("li");
    li.textContent = value;

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = (counter === 1);
    li.style.textDecoration = (counter === 1) ? "line-through" : "none";

    let deleteBtn = document.createElement("button");
    deleteBtn.textContent = 'X';
    deleteBtn.dataset.id = id;

    div.append(checkbox, li, deleteBtn);
    list.prepend(div);

    deleteBtn.addEventListener("click", () => {
        deleteTask(deleteBtn.dataset.id);
        div.remove();
    });

    checkbox.addEventListener("click", () => {
        updateCounter(id, checkbox.checked ? 1 : 0);
        li.style.textDecoration = checkbox.checked ? "line-through" : "none";
    });

    li.addEventListener("click", () => {
        if (!li.querySelector("input[type=text]") && !checkbox.checked) {
            let box = document.createElement("input");
            box.type = "text";
            box.classList.add("boxUpdate");
            box.value = value;
            li.textContent = "";
            li.appendChild(box);
            box.focus();

            box.addEventListener("blur", () => {
                let newValue = box.value.trim();
                if (newValue) {
                    li.textContent = newValue;
                    value = newValue;
                    updateTask(id, newValue);
                }
                 else {
                    li.textContent = value; 
                }
            });
        }
    });
}

submit.addEventListener("click", () => {
    let value = task.value.trim();
    if (value === '') {
        alert("Enter any data in input field");
    }
     else {
        createTask(value);
        task.value = "";
    }
});

function createTask(task) {
    savetodo(task, function(todo) {
        mytasklist(task, todo.id, todo.counter);
    });
}

function savetodo(value, callback) {
    let request = new XMLHttpRequest();
    request.open("POST", "/savetodo");
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({ task: value, id: Date.now(), counter: 0 }));
    request.addEventListener("load", function() {
        if (request.status === 200) {
            callback(JSON.parse(request.responseText));
        }
         else {
            console.error("Error saving todo:", request.statusText);
        }
    });
}

function getTodo(callback) {
    let request = new XMLHttpRequest();
    request.open("GET", "/gettodo");
    request.send();
    request.addEventListener("load", function() {
        if (request.status === 200) {
            callback(JSON.parse(request.responseText));
        } 
        else {
            console.error("Error fetching todos:", request.statusText);
        }
    });
}

function deleteTask(id) {
    var request = new XMLHttpRequest();
    request.open("DELETE", `/deletetodo/${id}`);
    request.send();
    request.addEventListener("load", function() {
        if (request.status !== 200) {
            alert("Failed to delete task");
        } 
        else {
            console.log("Task deleted successfully");
        }
    });
}

function updateCounter(id, counter) {
    var request = new XMLHttpRequest();
    request.open("PUT", `/updateCounter/${id}`);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({ counter: counter }));
    request.addEventListener("load", function() {
        if (request.status !== 200) {
            console.error("Failed to update task:", request.statusText);
        } 
        else {
            console.log("Task updated successfully");
        }
    });
}

function updateTask(id, newValue) {
    var request = new XMLHttpRequest();
    request.open("PUT", `/updatetask/${id}`);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({ task: newValue }));
    request.addEventListener("load", function() {
        if (request.status !== 200) {
            console.error("Failed to update task:", request.statusText);
        } 
        else {
            console.log("Task updated successfully");
        }
    });
}
