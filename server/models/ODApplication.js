module.exports = (sequelize, DataTypes) => {
  const ODApplication = sequelize.define('ODApplication', {
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    remarks: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id'] },
      { fields: ['status'] }
    ]
  });

  ODApplication.associate = (models) => {
    ODApplication.belongsTo(models.User, { foreignKey: 'student_id', as: 'student' });
    ODApplication.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
  };

  return ODApplication;
};
