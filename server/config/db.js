const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    pool: {
      max: config.poolSize,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: false // Set to console.log for query debugging
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`PostgreSQL Connected: ${config.database.host}:${config.database.port}/${config.database.name}`);
    return sequelize;
  } catch (error) {
    const primaryMessage = error?.message || error?.parent?.message || 'Unknown PostgreSQL connection error';
    const detail = error?.parent?.detail ? ` | detail: ${error.parent.detail}` : '';
    const code = error?.parent?.code || error?.original?.code;
    const codePart = code ? ` | code: ${code}` : '';
    console.error(`PostgreSQL Connection Error: ${primaryMessage}${codePart}${detail}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
