module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    department: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    regulation: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['code'] }
    ]
  });

  Course.associate = (models) => {
    Course.hasMany(models.CourseBatchTeacher, { foreignKey: 'course_id', as: 'courseBatches' });
    Course.hasMany(models.Assignment, { foreignKey: 'course_id', as: 'assignments' });
    Course.hasMany(models.Attendance, { foreignKey: 'course_id', as: 'attendances' });
    Course.hasMany(models.Marks, { foreignKey: 'course_id', as: 'marks' });
    Course.hasMany(models.Exam, { foreignKey: 'course_id', as: 'exams' });
  };

  return Course;
};
