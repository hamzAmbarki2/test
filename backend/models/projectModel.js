// models/projectModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.PENDING
    },
    teamRef: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
