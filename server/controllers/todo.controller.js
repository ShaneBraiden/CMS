const { Todo } = require('../models');

// @desc    Get user's todos
// @route   GET /api/todos
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    const formatted = todos.map(t => { const d = t.toJSON(); d._id = d.id; return d; });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create todo
// @route   POST /api/todos
exports.createTodo = async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const todo = await Todo.create({ user_id: req.user.id, title, description, due_date });
    const data = todo.toJSON(); data._id = data.id;
    res.status(201).json({ success: true, data, message: 'Todo added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update todo (toggle complete / edit)
// @route   PUT /api/todos/:id
exports.updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }

    const { title, description, due_date, completed } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (completed !== undefined) updateData.completed = completed;

    await todo.update(updateData);
    const data = todo.toJSON(); data._id = data.id;
    res.json({ success: true, data, message: 'Todo updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    await todo.destroy();
    res.json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
