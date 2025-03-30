// models/messageModel.js
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('./userModel');
const Group = require('./groupModel');

const Message = sequelize.define('Message', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    user_name:{
        type: Sequelize.STRING,
        allowNull: false
    },
    group_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: true,  // Automatically adds createdAt and updatedAt
});

// Define relationships
Message.belongsTo(User, { foreignKey: 'user_id' });  // Each message belongs to one user
Message.belongsTo(Group, { foreignKey: 'group_id' }); // Each message belongs to one group
User.hasMany(Message, { foreignKey: 'user_id' });    // One user can have many messages
Group.hasMany(Message, { foreignKey: 'group_id' });  // One group can have many messages

module.exports = Message;
