const express = require('express');
const auth = require('../middleware/auth');
const tasksService = require('../services/tasksService');

const router = express.Router();

router.use(auth);

router.post('/:projectId', async (req, res) => {
  try {
    const task = await tasksService.createTask(req.params.projectId, req.body, req.userId);
    res.status(201).json(task);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao criar tarefa' });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const tasks = await tasksService.listTasks(req.params.projectId, req.userId);
    res.json(tasks);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao listar tarefas' });
  }
});

router.put('/:taskId', async (req, res) => {
  try {
    const task = await tasksService.updateTask(req.params.taskId, req.body, req.userId);
    res.json(task);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao atualizar tarefa' });
  }
});

router.delete('/:taskId', async (req, res) => {
  try {
    await tasksService.deleteTask(req.params.taskId, req.userId);
    res.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao remover tarefa' });
  }
});

module.exports = router;
