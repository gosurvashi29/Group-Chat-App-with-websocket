// models/userGroupModel.js
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('./userModel');
const Group = require('./groupModel');

const UserGroup = sequelize.define('UserGroup', {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    isAdmin:{
        type: Sequelize.BOOLEAN}
}, {
    timestamps: true,  
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'group_id']  // Prevent duplicates
        }
    ]
});

// Correcting the associations
User.belongsToMany(Group, { through: UserGroup, foreignKey: 'user_id' }); // A user can belong to many groups
Group.belongsToMany(User, { through: UserGroup, foreignKey: 'group_id' }); // A group can have many users

module.exports = UserGroup;
