module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define('Exam', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'SET NULL'
    },
    exam_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    venue: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    exam_type: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['course_id'] },
      { fields: ['exam_date'] }
    ]
  });

  Exam.associate = (models) => {
    Exam.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Exam.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return Exam;
};
