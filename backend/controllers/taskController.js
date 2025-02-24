// controllers/taskController.js
const Task = require('../models/taskModel');

exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    return res.status(201).json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assigned')
      .populate('projectRef')
      .populate('milestoneRef');
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigned')
      .populate('projectRef')
      .populate('milestoneRef');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
