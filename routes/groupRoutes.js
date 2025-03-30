const express = require('express');
const router = express.Router();
const authenticate = require("../middleware/auth");
const upload = require("../middleware/upload");
const { 
    createGroup, 
    getGroups, 
    inviteUserToGroup, 
    sendMessageToGroup ,
    getMessagesFromGroup,
    removeUserFromGroup,
    makeAdminGroup,
    sendMultimedia,
    getActiveUsers
} = require('../controllers/groupController');

// Create a new group
router.post('/create', authenticate, createGroup);

// Get all groups the user is a part of
router.get('/', authenticate, getGroups);

// Invite a user to a group
router.post('/invite', authenticate, inviteUserToGroup);

// Remove a user
router.post('/remove', authenticate, removeUserFromGroup);

// Make Admin
router.post('/makeadmin', authenticate, makeAdminGroup);

// Send a message in a group
router.post('/sendMessage', authenticate,sendMessageToGroup);

router.get('/messages', authenticate, getMessagesFromGroup);

//Send multimedia files
router.post('/sendMultimedia', authenticate,upload, sendMultimedia);

router.get('/active-users', authenticate, getActiveUsers);



module.exports = router;
