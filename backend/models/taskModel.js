// models/taskModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title:       { type: String, required: true },
    description: { type: String },
    dueDate:     { type: Date },
    // assigned user
    assigned: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // reference to a project or milestone
    projectRef: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    milestoneRef: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
