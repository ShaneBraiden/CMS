module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Assignments', key: 'id' },
      onDelete: 'CASCADE'
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    student_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: true
    },
    comments: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded'),
      defaultValue: 'submitted'
    },
    marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    feedback: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    graded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    graded_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['assignment_id', 'student_id'], unique: true },
      { fields: ['student_id'] },
      { fields: ['status'] }
    ]
  });

  Submission.associate = (models) => {
    Submission.belongsTo(models.Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
    Submission.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
    Submission.belongsTo(models.User, { foreignKey: 'graded_by', as: 'grader' });
  };

  return Submission;
};
