const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Job role name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  iconName: {
    type: String,
    required: true,
    default: 'BriefcaseIcon'
  },
  gradient: {
    type: String,
    default: 'from-blue-500 to-cyan-500'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true  // This automatically adds createdAt and updatedAt
});

// Remove the manual pre-save hook since timestamps: true handles it
// jobRoleSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

module.exports = mongoose.model('JobRole', jobRoleSchema);