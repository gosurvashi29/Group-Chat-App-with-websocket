require('dotenv').config();
const express = require("express");
const AWS = require('aws-sdk');
const { Op } = require('sequelize');
const Group = require('../models/groupModel');
const GroupMember = require('../models/userGroupModel');
const Message = require('../models/messagesModel');
const User = require('../models/userModel');
const AWSService = require('../services/awsService');
const sequelize = require("../util/database");
const fs = require('fs');
const path = require('path');
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const io = new Server(http.createServer(app));

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        const group = await Group.create({
            name,
            createdBy: userId
        });

        await GroupMember.create({
            group_id: group.id,
            user_id: userId,
            isAdmin: true
        });

        res.status(201).json({ group });
    } catch (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groupMembers = await GroupMember.findAll({
            where: { user_id: userId },
            attributes: ['group_id']
        });
        
        const name = await User.findOne({ where: { id: userId } });
        const groupIds = groupMembers.map(groupMember => groupMember.group_id);

        if (groupIds.length === 0) {
            return res.json({ groupsName: [] });
        }

        const groups = await Group.findAll({
            where: { id: groupIds }
        });

        const groupsData = groups.map(group => ({
            id: group.id,
            name: group.name
        }));

        res.json({ groups: groupsData, name:name});
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

// Send message to group
exports.sendMessageToGroup = async (req, res) => {
    try {
        const { group_id, message } = req.body;
        const userId = req.user.id;

        const isMember = await GroupMember.findOne({
            where: { user_id: userId, group_id }
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        const name = await User.findOne({ where: { id: userId } });

        const newMessage = await Message.create({
            message,
            user_id: userId,
            user_name: name.username,
            group_id: group_id,
        });

      

        res.status(201).json({ message: newMessage });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get messages from group
exports.getMessagesFromGroup = async (req, res) => {
    try {
        const { groupId } = req.query;
        const userId = req.user.id;

        const isMember = await GroupMember.findOne({
            where: { user_id: userId, group_id: groupId }
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        const messages = await Message.findAll({
            where: { group_id: groupId },
            attributes: ['user_name', 'message'],
            order: [['createdAt', 'ASC']],
        });

        if (!messages) {
            return res.status(404).json({ error: 'No messages found for this group' });
        }

        res.status(200).json({ messages });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};



// Invite a user to a group
exports.inviteUserToGroup = async (req, res) => {
    try {
        const { groupName, userName } = req.body; 
        const userId = req.user.id; 

       
        const group = await Group.findOne({ where: { name: groupName } });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        console.log(group)
        
        const isAdmin = await GroupMember.findOne({
            attributes: ['isAdmin'],  
            where: {
                user_id: userId,
                group_id: group.id
            }
        });

        console.log(isAdmin)
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can invite users' });
        }
        console.log("usergroup created")
        
        const invitee = await User.findOne({ where: { username: userName } });

        if (!invitee) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log("group id is", group.id)
        console.log("invitee id is", invitee.id)
        
        await GroupMember.create({
            group_id: group.id,   
            user_id: invitee.id,
            isAdmin:false 
        });

        res.status(200).json({ message: 'User invited successfully',group_id:group.id });
    } catch (err) {
        console.error('Error inviting user to group:', err);
        res.status(500).json({ error: 'Failed to invite user' });
    }
};



// Remove a user 
exports.removeUserFromGroup = async (req, res) => {
    try {
        const { groupName, userName } = req.body; 
        const userId = req.user.id; 

        
        const group = await Group.findOne({ where: { name: groupName } });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        console.log(group);
        
        const isAdmin = await GroupMember.findOne({
            attributes: ['isAdmin'],  
            where: {
                user_id: userId,
                group_id: group.id
            }
        });

        console.log(isAdmin);
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can remove users' });
        }
        
        
        const userToRemove = await User.findOne({ where: { username: userName } });

        if (!userToRemove) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log("group id is", group.id);
        console.log("user to remove id is", userToRemove.id);

        
        await GroupMember.destroy({
            where: {
                group_id: group.id,    
                user_id: userToRemove.id  
            }
        });

        res.status(200).json({ message: 'User removed successfully' });
    } catch (err) {
        console.error('Error removing user from group:', err);
        res.status(500).json({ error: 'Failed to remove user' });
    }
};

// Make Group Admin
exports.makeAdminGroup = async (req, res) => {
    try {
        const { groupName, userName } = req.body; 
        const userId = req.user.id; 

       
        const group = await Group.findOne({ where: { name: groupName } });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        console.log(group)
        
        const isAdmin = await GroupMember.findOne({
            attributes: ['isAdmin'],  
            where: {
                user_id: userId,
                group_id: group.id
            }
        });
       
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can invite users' });
        }
        console.log("usergroup created")
        
        const invitee = await User.findOne({ where: { username: userName } });

        if (!invitee) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log("group id is", group.id)
        console.log("invitee id is", invitee.id)
        
        
        invitee.isAdmin=true;
        await invitee.save();

        res.status(200).json({ message: 'User made admin successfully' });
    } catch (err) {
        console.error('Error inviting user to group:', err);
        res.status(500).json({ error: 'Failed to invite user' });
    }
};

// Send a multi
exports.sendMultimedia = async (req, res) => {
    try {
        const { group_id } = req.body;
        const { message } = req.body;
        const userId = req.user.id;

        
        const isMember = await GroupMember.findOne({
            where: { user_id:userId, group_id }
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }
        const name = await User.findOne({
            where: { id:userId}
        });
        
        const filePath=message
        const data = fs.createReadStream(filePath);

        // Generate unique key for the file as bucket does versioning
        const fileName = `chat-${userId}-${Date.now()}`;


        const uploadResult = await uploadToS3(data, fileName);
        console.log(uploadResult)
        const newMessage = await Message.create({
            //message :uploadResult,
            message,
            user_id:userId,
            user_name: name.username,
            group_id:group_id,
        });


        


        res.status(201).json({ message: newMessage });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};



async function uploadToS3(data, fileName){ 
    const s3bucket = new AWS.S3({
        accessKeyId: process.env.IAM_USER_KEY, 
        secretAccessKey: process.env.IAM_USER_SECRET,
        bucket_name: process.env.BUCKET_NAME
    });

    s3bucket.createBucket(()=>{
        var params={
            Bucket : process.env.BUCKET_NAME,
            Key : fileName,
            Body : data,
            ACL: "public-read"
        }
        return new Promise((resolve, reject)=>{
        s3bucket.upload(params,(err,s3response)=>{
            if(err){
                console.log("cant upload to s3", err)
                reject(err)
            }
            else{
                console.log("upload to s3 success", s3response.Location)
                resolve(s3response.Location)
            }
        })
    })
    })

}




exports.getActiveUsers = async (req, res) => {
    try {
        const { selectedGroupId } = req.query;
        const userId = req.user.id;
        
        if (!selectedGroupId) {
            return res.status(403).json({ error: 'No group selected' });
        }
        // Check if the requesting user is a member of the group
        const isMember = await GroupMember.findOne({
            where: { user_id: userId, group_id: selectedGroupId }
        });

        if (!isMember) {
            return res.status(403).json({ error: 'No members in group' });
        }

        // Retrieve all users who belong to the group
        const groupMembers = await GroupMember.findAll({
            where: { group_id: selectedGroupId },
            attributes: ['user_id'] // Get only user_id
        });

        const userIds = groupMembers.map(member => member.user_id);

        // Fetch usernames of all members in the group
        const users = await User.findAll({
            where: {
                id: userIds // Match users' ids from GroupMember table
            },
            attributes: ['id', 'username']
        });

        // Return the list of usernames of active users in the group
        res.status(200).json({ users });
    } catch (err) {
        console.error("Error fetching active users:", err);
        res.status(500).json({ error: "Failed to fetch active users" });
    }
};
