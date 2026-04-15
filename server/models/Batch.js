module.exports = (sequelize, DataTypes) => {
  const Batch = sequelize.define('Batch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    department: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    teacher_id: {
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
      { fields: ['teacher_id'] }
    ]
  });

  Batch.associate = (models) => {
    Batch.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'teacher' });
    Batch.hasMany(models.User, { foreignKey: 'batch_id', as: 'students' });
    Batch.hasOne(models.Timetable, { foreignKey: 'batch_id', as: 'timetable' });
  };

  return Batch;
};
