const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const list = document.getElementById("todoList");
const empty = document.getElementById("empty");
const clearAllBtn = document.getElementById("clearAll");
const checkAllBtn = document.getElementById("checkAll");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (text === "") return;

  todos.push({ text: text, done: false });
  input.value = "";
  render();
});

clearAllBtn.addEventListener("click", function () {
  if (todos.length === 0) return;
  if (confirm("Delete all tasks?")) {
    todos = [];
    render();
  }
});

checkAllBtn.addEventListener("click", function () {
  todos.forEach((t) => (t.done = true));
  render();
});

function render() {
  localStorage.setItem("todos", JSON.stringify(todos));
  list.innerHTML = "";

  if (todos.length === 0) {
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
  }

  for (let i = 0; i < todos.length; i++) {
    const todo = todos[i];

    const li = document.createElement("li");
    li.className = "todo";
    if (todo.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", function () {
      todos[i].done = checkbox.checked;
      render();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.textContent = "X";
    deleteBtn.addEventListener("click", function () {
      todos.splice(i, 1);
      render();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

render();
