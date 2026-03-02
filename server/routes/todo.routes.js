const router = require('express').Router();
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo
} = require('../controllers/todo.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTodos);
router.post('/', protect, createTodo);
router.put('/:id', protect, updateTodo);
router.delete('/:id', protect, deleteTodo);

module.exports = router;
