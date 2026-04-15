module.exports = (sequelize, DataTypes) => {
  const TimetableSlot = sequelize.define('TimetableSlot', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    timetable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Timetables', key: 'id' },
      onDelete: 'CASCADE'
    },
    day: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      allowNull: false
    },
    hour: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    faculty: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    room: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    timestamps: false,
    indexes: [
      { fields: ['timetable_id', 'day', 'hour'], unique: true },
      { fields: ['timetable_id'] }
    ]
  });

  TimetableSlot.associate = (models) => {
    TimetableSlot.belongsTo(models.Timetable, { foreignKey: 'timetable_id', as: 'timetable' });
  };

  return TimetableSlot;
};
