import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheck, HiOutlineClipboardCheck } from 'react-icons/hi';

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try { const { data } = await API.get('/todos'); setTodos(data.data); }
    catch { toast.error('Failed to load todos'); }
    finally { setLoading(false); }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await API.post('/todos', { title: newTodo });
      setNewTodo('');
      fetchTodos();
    } catch { toast.error('Failed to add'); }
  };

  const toggleTodo = async (todo) => {
    try {
      await API.put(`/todos/${todo._id || todo.id}`, { completed: !todo.completed });
      fetchTodos();
    } catch { toast.error('Failed'); }
  };

  const deleteTodo = async (id) => {
    try { await API.delete(`/todos/${id}`); fetchTodos(); }
    catch { toast.error('Failed'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  const remaining = todos.filter(t => !t.completed).length;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <p className="label-inst text-cardinal-700">Personal</p>
        <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">To-Do list</h1>
        <div className="divider-gold mt-3 max-w-[120px]" />
        <p className="text-sm text-gray-500 mt-3">
          {remaining > 0 ? `${remaining} task${remaining === 1 ? '' : 's'} remaining` : 'Nothing pending'}
        </p>
      </div>

      {/* ── Add form ── */}
      <form onSubmit={addTodo} className="surface-card p-4 flex gap-3">
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new task…"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                     focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
        />
        <button
          type="submit"
          className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                     px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                     border border-cardinal-800 flex items-center gap-2 transition-colors"
        >
          <HiOutlinePlus className="w-5 h-5" /> Add
        </button>
      </form>

      {/* ── List ── */}
      {todos.length > 0 ? (
        <div className="space-y-2">
          {todos.map(todo => (
            <div
              key={todo._id || todo.id}
              className="surface-card px-4 py-3 flex items-center gap-4 hover:border-cardinal-300 transition-colors"
            >
              <button
                onClick={() => toggleTodo(todo)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  todo.completed
                    ? 'bg-cardinal-700 border-cardinal-700 text-white'
                    : 'border-gray-300 hover:border-cardinal-500'
                }`}
              >
                {todo.completed && <HiOutlineCheck className="w-4 h-4" />}
              </button>
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo(todo._id || todo.id)}
                className="text-gray-400 hover:text-cardinal-700 p-1 transition-colors"
                title="Delete"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineClipboardCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No tasks yet</p>
          <p className="text-sm text-gray-500 mt-1">Add a task above to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Todos;
