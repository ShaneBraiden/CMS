module.exports = (sequelize, DataTypes) => {
  const Timetable = sequelize.define('Timetable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'Batches', key: 'id' },
      onDelete: 'CASCADE'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Timetable.associate = (models) => {
    Timetable.belongsTo(models.Batch, { foreignKey: 'batch_id', as: 'batch' });
    Timetable.hasMany(models.TimetableSlot, { foreignKey: 'timetable_id', as: 'slots' });
  };

  return Timetable;
};
