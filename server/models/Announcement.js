module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    created_by_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    target_audience: {
      type: DataTypes.ENUM('all', 'students', 'teachers'),
      defaultValue: 'all'
    },
    priority: {
      type: DataTypes.ENUM('high', 'normal', 'low'),
      defaultValue: 'normal'
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Announcement.associate = (models) => {
    Announcement.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return Announcement;
};
