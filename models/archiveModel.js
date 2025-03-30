const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('./userModel');
const ArchivedChat = sequelize.define('ArchivedChat', {
    
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
    tableName: 'ArchivedChats',  
    timestamps: true,  
});

module.exports = ArchivedChat;
