const express = require('express');
const auth = require('../middleware/auth');
const tasksService = require('../services/tasksService');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.use(auth);

router.post('/', catchAsync(async (req, res) => {
  const { project_id, ...data } = req.body;
  const task = await tasksService.createTask(project_id, data, req.userId);

  // Notificar WebSockets
  const io = req.app.get('io');
  io.to(`project_${project_id}`).emit('task:created', { task });

  res.status(201).json({ success: true, data: task });
}));

router.get('/', catchAsync(async (req, res) => {
  const { projectId } = req.query;
  const tasks = await tasksService.listTasks(projectId, req.userId);
  res.json({ success: true, data: tasks });
}));

router.put('/:taskId', catchAsync(async (req, res) => {
  const task = await tasksService.updateTask(req.params.taskId, req.body, req.userId);

  // Notificar WebSockets
  const io = req.app.get('io');
  io.to(`project_${task.projectId}`).emit('task:updated', { task });

  res.json({ success: true, data: task });
}));

router.delete('/:taskId', catchAsync(async (req, res) => {
  // Precisamos do projectId para notificar a sala correta
  // O ideal seria buscar a tarefa antes de deletar ou o service retornar o projectId
  // Vamos buscar a tarefa para ter o projectId antes de deletar
  const task = await tasksService.listTasksByTaskId(req.params.taskId, req.userId); // Nova função necessária

  await tasksService.deleteTask(req.params.taskId, req.userId);

  // Notificar WebSockets
  const io = req.app.get('io');
  io.to(`project_${task.projectId}`).emit('task:deleted', { taskId: req.params.taskId });

  res.json({ success: true });
}));

module.exports = router;
