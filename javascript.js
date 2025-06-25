const todoInput = document.querySelector(".todoInput");
const categoryInput = document.querySelector(".categoryInput");
const form = document.querySelector(".form");
const todosOutput = document.querySelector("#sortableList");
const deleteAllBtn = document.querySelector(".delete-all");
const importInput = document.querySelector(".import-input");
const notification = document.querySelector(".notification");
const linkCount = document.querySelector("#linkCount");
const themeSelect = document.querySelector("#themeSelect");
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

let confirmCallback = null;

function notify(msg) {
  notification.textContent = msg;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function showConfirm(message, onConfirm) {
  document.getElementById("confirmMessage").textContent = message;
  confirmOverlay.classList.add("active");
  confirmCallback = onConfirm;
}

confirmYesBtn.addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
  confirmOverlay.classList.remove("active");
});

confirmNoBtn.addEventListener("click", () => {
  confirmOverlay.classList.remove("active");
});

function updateTheme(theme) {
  document.body.className = "theme-" + theme;
  localStorage.setItem("theme", theme);
}

themeSelect.addEventListener("change", (e) => {
  updateTheme(e.target.value);
});

function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  themeSelect.value = saved;
  updateTheme(saved);
}

function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  const todos = getTodos();
  todosOutput.innerHTML = "";
  todos.forEach((todo, i) => {
    const li = document.createElement("li");
    const label = todo.label || `Link ${i + 1}`;
    li.innerHTML = `
      <div class="link-header">
        <a href="${todo.text}" target="_blank">${label}</a>
        <div class="icons">
          <i class="fas fa-trash delete-todo" data-index="${i}"></i>
        </div>
      </div>
    `;
    todosOutput.appendChild(li);
  });
  linkCount.textContent = todos.length;
  deleteAllBtn.style.display = todos.length > 1 ? "inline-block" : "none";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const links = todoInput.value.split(",").map(x => x.trim()).filter(x => x);
  const category = categoryInput.value.trim();
  if (!links.length) return;
  let todos = getTodos();
  links.forEach(link => {
    todos.unshift({ text: link, category });
  });
  saveTodos(todos);
  todoInput.value = "";
  categoryInput.value = "";
  notify("Links added successfully!");
  renderTodos();
});

todosOutput.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-todo")) {
    const index = parseInt(e.target.dataset.index);
    showConfirm("Delete this link?", () => {
      let todos = getTodos();
      todos.splice(index, 1);
      saveTodos(todos);
      renderTodos();
    });
  }
});

deleteAllBtn.addEventListener("click", () => {
  showConfirm("Are you sure you want to delete all links?", () => {
    localStorage.removeItem("todos");
    renderTodos();
  });
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  if (file.name.endsWith(".csv")) {
    reader.onload = () => {
      const rows = reader.result.split("\n").map(r => r.split(","));
      const [header, ...data] = rows;
      const nameIndex = header.findIndex(h => h.toLowerCase().includes("name"));
      const linkIndex = header.findIndex(h => h.toLowerCase().includes("link"));
      if (nameIndex === -1 || linkIndex === -1) return notify("Missing 'name' or 'link' column");
      const todos = data.map(row => ({ text: row[linkIndex], label: row[nameIndex] })).filter(t => t.text);
      if (todos.length) {
        saveTodos([...todos, ...getTodos()]);
        notify("CSV imported successfully!");
        renderTodos();
      }
    };
    reader.readAsText(file);
  } else if (file.name.endsWith(".xlsx")) {
    reader.onload = (ev) => {
      const workbook = XLSX.read(ev.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const todos = json.map(row => ({ text: row.link, label: row.name })).filter(t => t.text);
      if (todos.length) {
        saveTodos([...todos, ...getTodos()]);
        notify("XLSX imported successfully!");
        renderTodos();
      }
    };
    reader.readAsBinaryString(file);
  } else {
    notify("Unsupported file format. Please upload CSV or XLSX.");
  }
});

// Initial Load
initTheme();
renderTodos();
