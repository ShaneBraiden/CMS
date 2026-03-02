const Todo = require('../models/Todo');

// @desc    Get user's todos
// @route   GET /api/todos
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user_id: req.user._id }).sort({ created_at: -1 });
    res.json({ success: true, data: todos });
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

    const todo = await Todo.create({
      user_id: req.user._id,
      title,
      description,
      due_date
    });

    res.status(201).json({ success: true, data: todo, message: 'Todo added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update todo (toggle complete / edit)
// @route   PUT /api/todos/:id
exports.updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }

    const { title, description, due_date, completed } = req.body;
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (due_date !== undefined) todo.due_date = due_date;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();
    res.json({ success: true, data: todo, message: 'Todo updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    res.json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
