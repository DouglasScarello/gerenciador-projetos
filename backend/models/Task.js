const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);


