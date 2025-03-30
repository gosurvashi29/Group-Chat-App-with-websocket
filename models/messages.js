const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../util/database');
const User=require("./user");
const Group=require("./group");

const Message = sequelize.define('message', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
 message: {
    type: Sequelize.STRING,
    allowNull: false,
    
  },
 userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  recipientId: {
    type: Sequelize.INTEGER,
    references: {
      model: "users",
      key: "id",
      allowNull: true, // Make this field optional
    },
  },
 
 
});

User.hasMany(Message, { foreignKey: 'userId' });
  Message.belongsTo(User, { foreignKey: 'userId' });

  // Group - Message association (One-to-Many)
  Group.hasMany(Message, { foreignKey: 'groupId' });
  Message.belongsTo(Group, { foreignKey: 'groupId' });


module.exports = Message;
