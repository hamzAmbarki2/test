// controllers/projectController.js
const Project = require('../models/projectModel');

exports.createProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    return res.status(201).json(project);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('teamRef');
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('teamRef');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json(project);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
