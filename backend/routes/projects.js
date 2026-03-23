const express = require('express');
const auth = require('../middleware/auth');
const projectsService = require('../services/projectsService');

const router = express.Router();

router.use(auth);

router.post('/', async (req, res) => {
  try {
    const project = await projectsService.createProject(req.body, req.userId);
    res.status(201).json(project);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao criar projeto', error: err.error });
  }
});

router.get('/', async (req, res) => {
  try {
    const projects = await projectsService.listUserProjects(req.userId);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar projetos', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await projectsService.updateProject(req.params.id, req.userId, req.body);
    res.json(project);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao atualizar projeto', error: err.error });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await projectsService.deleteProject(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Erro ao remover projeto', error: err.error });
  }
});

module.exports = router;
