module.exports = (sequelize, DataTypes) => {
  const Marks = sequelize.define('Marks', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Courses', key: 'id' },
      onDelete: 'CASCADE'
    },
    exam_type: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    max_marks: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Marks',
    indexes: [
      { fields: ['student_id'] },
      { fields: ['course_id'] }
    ]
  });

  Marks.associate = (models) => {
    Marks.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
    Marks.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
  };

  return Marks;
};
