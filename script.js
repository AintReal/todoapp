
const STORAGE_KEY = 'todoapp.state.v1';

// State
let state = loadState();

// DOM refs
const listsEl        = document.getElementById('lists');
const newListBtn     = document.getElementById('newListBtn');
const currentTitleEl = document.getElementById('currentListTitle');
const todoCountEl    = document.getElementById('todoCount');
const todoForm       = document.getElementById('todoForm');
const todoInput      = document.getElementById('todoInput');
const checkAllBtn    = document.getElementById('checkAllBtn');
const deleteAllBtn   = document.getElementById('deleteAllBtn');
const todosEl        = document.getElementById('todos');
const emptyEl        = document.getElementById('emptyState');


function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lists: [], activeId: null };
    const parsed = JSON.parse(raw);
    if (!parsed.lists) return { lists: [], activeId: null };
    return parsed;
  } catch {
    return { lists: [], activeId: null };
  }
}

function getActiveList() {
  return state.lists.find(l => l.id === state.activeId) || null;
}

// Rendering 
function render() {
  renderSidebar();
  renderMain();
}

function renderSidebar() {
  listsEl.innerHTML = '';

  state.lists.forEach(list => {
    const li = document.createElement('div');
    li.className = 'list-item' + (list.id === state.activeId ? ' active' : '');
    li.dataset.id = list.id;

    const name = document.createElement('span');
    name.className = 'list-item__name';
    name.textContent = list.name;
    name.title = 'Double-click to rename';

    const count = document.createElement('span');
    count.className = 'list-item__count';
    count.textContent = list.todos.length;

    const del = document.createElement('button');
    del.className = 'list-item__delete';
    del.title = 'Delete list';
    del.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
      </svg>`;

    // Click to select
    li.addEventListener('click', (e) => {
      if (e.target.closest('.list-item__delete')) return;
      if (e.target.classList.contains('list-item__name-input')) return;
      selectList(list.id);
    });

    // Double-click to rename
    name.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startRename(li, list);
    });

    // Delete
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteList(list.id);
    });

    li.appendChild(name);
    li.appendChild(count);
    li.appendChild(del);
    listsEl.appendChild(li);
  });
}

function renderMain() {
  const list = getActiveList();

  if (!list) {
    currentTitleEl.textContent = 'Select a list';
    todoCountEl.textContent = '0 tasks';
    todoInput.disabled = true;
    checkAllBtn.disabled = true;
    deleteAllBtn.disabled = true;
    todosEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  currentTitleEl.textContent = list.name;
  const total = list.todos.length;
  const doneCount = list.todos.filter(t => t.done).length;
  todoCountEl.textContent = total === 0
    ? '0 tasks'
    : `${doneCount}/${total} done`;

  todoInput.disabled = false;
  checkAllBtn.disabled = total === 0;
  deleteAllBtn.disabled = total === 0;

  todosEl.innerHTML = '';
  list.todos.forEach(todo => todosEl.appendChild(renderTodo(todo)));

  emptyEl.classList.toggle('hidden', total > 0);
}

function renderTodo(todo) {
  const li = document.createElement('li');
  li.className = 'todo' + (todo.done ? ' done' : '');

  const box = document.createElement('span');
  box.className = 'checkbox';
  box.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;
  box.addEventListener('click', () => toggleTodo(todo.id));

  const text = document.createElement('span');
  text.className = 'todo__text';
  text.textContent = todo.text;

  const del = document.createElement('button');
  del.className = 'todo__delete';
  del.title = 'Delete';
  del.innerHTML = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;
  del.addEventListener('click', () => deleteTodo(todo.id));

  li.appendChild(box);
  li.appendChild(text);
  li.appendChild(del);
  return li;
}

// Lists actions
function createList() {
  const list = { id: uid(), name: '', todos: [] };
  state.lists.push(list);
  state.activeId = list.id;
  saveState();
  render();

  // Immediately allow naming inline
  const li = listsEl.querySelector(`.list-item[data-id="${list.id}"]`);
  if (li) startRename(li, list, /*isNew*/ true);
}

function startRename(li, list, isNew = false) {
  const nameEl = li.querySelector('.list-item__name');
  if (!nameEl) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'list-item__name-input';
  input.value = list.name;
  input.placeholder = 'List name';
  li.replaceChild(input, nameEl);
  input.focus();
  input.select();

  const commit = () => {
    const value = input.value.trim();
    if (!value) {
      if (isNew) {
        // Cancel: remove the empty new list
        state.lists = state.lists.filter(l => l.id !== list.id);
        if (state.activeId === list.id) state.activeId = state.lists[0]?.id || null;
      }
    } else {
      list.name = value;
    }
    saveState();
    render();
  };

  let committed = false;
  const onceCommit = () => {
    if (committed) return;
    committed = true;
    commit();
  };

  input.addEventListener('blur', onceCommit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    else if (e.key === 'Escape') {
      if (isNew) input.value = '';
      else input.value = list.name;
      input.blur();
    }
  });
}

function selectList(id) {
  state.activeId = id;
  saveState();
  render();
  todoInput.focus();
}

function deleteList(id) {
  const list = state.lists.find(l => l.id === id);
  if (!list) return;
  showConfirm(`Delete list "${list.name}"? This cannot be undone.`, () => {
    state.lists = state.lists.filter(l => l.id !== id);
    if (state.activeId === id) state.activeId = state.lists[0]?.id || null;
    saveState();
    render();
  });
}

// ---- Todo actions ---------------------------------------------
function addTodo(text) {
  const list = getActiveList();
  if (!list) return;
  list.todos.push({ id: uid(), text, done: false });
  saveState();
  render();
}

function toggleTodo(id) {
  const list = getActiveList();
  if (!list) return;
  const todo = list.todos.find(t => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  saveState();
  render();
}

function deleteTodo(id) {
  const list = getActiveList();
  if (!list) return;
  list.todos = list.todos.filter(t => t.id !== id);
  saveState();
  render();
}

function checkAll() {
  const list = getActiveList();
  if (!list || list.todos.length === 0) return;
  const allDone = list.todos.every(t => t.done);
  list.todos.forEach(t => t.done = !allDone); // toggle
  saveState();
  render();
}

function deleteAll() {
  const list = getActiveList();
  if (!list || list.todos.length === 0) return;
  showConfirm(`Delete all ${list.todos.length} tasks in "${list.name}"?`, () => {
    list.todos = [];
    saveState();
    render();
  });
}

// Events
newListBtn.addEventListener('click', createList);

function showConfirm(msg, onConfirm) {
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalMsg').textContent = msg;
  overlay.classList.add('open');
  const close = () => overlay.classList.remove('open');
  document.getElementById('modalConfirm').onclick = () => { close(); onConfirm(); };
  document.getElementById('modalCancel').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (!value) return;
  addTodo(value);
  todoInput.value = '';
  todoInput.focus();
});

checkAllBtn.addEventListener('click', checkAll);
deleteAllBtn.addEventListener('click', deleteAll);

// Auto-select first list if none active
if (!state.activeId && state.lists.length > 0) {
  state.activeId = state.lists[0].id;
}
render();
