const express = require('express');
const auth = require('../middleware/auth');
const projectsService = require('../services/projectsService');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use(auth);

router.post('/', catchAsync(async (req, res) => {
  const project = await projectsService.createProject(req.body, req.userId);
  res.status(201).json(project);
}));

router.get('/', catchAsync(async (req, res) => {
  const projects = await projectsService.listUserProjects(req.userId, req.query);
  res.json(projects);
}));

router.put('/:id', catchAsync(async (req, res) => {
  const project = await projectsService.updateProject(req.params.id, req.userId, req.body);
  res.json(project);
}));

router.delete('/:id', catchAsync(async (req, res) => {
  await projectsService.deleteProject(req.params.id, req.userId);
  res.json({ success: true });
}));

module.exports = router;
