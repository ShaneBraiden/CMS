module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('present', 'absent'),
      defaultValue: 'absent'
    },
    hourly_status: {
      type: DataTypes.JSON,
      defaultValue: ['N', 'N', 'N', 'N', 'N', 'N', 'N']
    },
    marked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    marked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id', 'course_id', 'date'], unique: true },
      { fields: ['student_id'] },
      { fields: ['course_id'] },
      { fields: ['date'] }
    ]
  });

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
    Attendance.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Attendance.belongsTo(models.User, { foreignKey: 'marked_by', as: 'marker' });
  };

  return Attendance;
};
