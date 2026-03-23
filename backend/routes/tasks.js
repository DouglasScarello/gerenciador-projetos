const express = require('express');
const auth = require('../middleware/auth');
const tasksService = require('../services/tasksService');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use(auth);

router.post('/:projectId', catchAsync(async (req, res) => {
  const task = await tasksService.createTask(req.params.projectId, req.body, req.userId);
  res.status(201).json({ success: true, data: task });
}));

router.get('/:projectId', catchAsync(async (req, res) => {
  const tasks = await tasksService.listTasks(req.params.projectId, req.userId);
  res.json({ success: true, data: tasks });
}));

router.put('/:taskId', catchAsync(async (req, res) => {
  const task = await tasksService.updateTask(req.params.taskId, req.body, req.userId);
  res.json({ success: true, data: task });
}));

router.delete('/:taskId', catchAsync(async (req, res) => {
  await tasksService.deleteTask(req.params.taskId, req.userId);
  res.json({ success: true });
}));

module.exports = router;
