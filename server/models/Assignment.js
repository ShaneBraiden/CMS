module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_marks: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['course_id'] },
      { fields: ['teacher_id'] }
    ]
  });

  Assignment.associate = (models) => {
    Assignment.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Assignment.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
    Assignment.hasMany(models.Submission, { foreignKey: 'assignment_id', as: 'submissions' });
  };

  return Assignment;
};
