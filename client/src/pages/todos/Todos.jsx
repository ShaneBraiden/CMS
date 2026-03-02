import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiCheck } from 'react-icons/hi';

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try { const { data } = await API.get('/todos'); setTodos(data.data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await API.post('/todos', { title: newTodo });
      setNewTodo('');
      fetchTodos();
    } catch { toast.error('Failed'); }
  };

  const toggleTodo = async (todo) => {
    try {
      await API.put(`/todos/${todo._id}`, { completed: !todo.completed });
      fetchTodos();
    } catch { toast.error('Failed'); }
  };

  const deleteTodo = async (id) => {
    try { await API.delete(`/todos/${id}`); fetchTodos(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Todos</h1>

      <form onSubmit={addTodo} className="flex gap-3 mb-6">
        <input
          type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <HiPlus className="w-5 h-5" /> Add
        </button>
      </form>

      <div className="space-y-2">
        {todos.map(todo => (
          <div key={todo._id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-3">
            <button onClick={() => toggleTodo(todo)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
            }`}>
              {todo.completed && <HiCheck className="w-4 h-4" />}
            </button>
            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.title}</span>
            <button onClick={() => deleteTodo(todo._id)} className="text-gray-400 hover:text-red-500"><HiTrash className="w-4 h-4" /></button>
          </div>
        ))}
        {todos.length === 0 && <p className="text-gray-500 text-center py-8">No todos yet. Add one above!</p>}
      </div>
    </div>
  );
};

export default Todos;
