module.exports = (sequelize, DataTypes) => {
  const CourseBatchTeacher = sequelize.define('CourseBatchTeacher', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Batches', key: 'id' },
      onDelete: 'CASCADE'
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['course_id', 'batch_id', 'teacher_id'], unique: true },
      { fields: ['course_id'] },
      { fields: ['batch_id'] },
      { fields: ['teacher_id'] }
    ]
  });

  CourseBatchTeacher.associate = (models) => {
    CourseBatchTeacher.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    CourseBatchTeacher.belongsTo(models.Batch, { foreignKey: 'batch_id', as: 'batch' });
    CourseBatchTeacher.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
  };

  return CourseBatchTeacher;
};
