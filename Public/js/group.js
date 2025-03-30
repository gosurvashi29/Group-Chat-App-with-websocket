// Assuming you are already connected to Socket.io
// const socket = io();  // Connect to the socket server
const token = localStorage.getItem('token'); 
let selectedGroupId = null;  // Current group id

// Ensure user is authenticated
if (!token) {
    console.error('No token found. Please log in.');
    window.location.href = '../views/LogIn';  
}


    // Listen for new messages from the server
    socket.on('newMessage', (messageData) => {
        const { message, userName } = messageData;
        const messagesContainer = document.getElementById('messages');
        
        // Create a new message element
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${userName}</strong>: ${message}`;
        
        // Append the message to the messages container
        messagesContainer.appendChild(messageElement);

        // Scroll to the bottom to show the newest message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

// Load and display all groups
async function loadGroups() {
    try {
        const response = await axios.get('http://localhost:9000/groups', {
            headers: { 'Authorization': token }
        });

        console.log(response.data.groups);  
        console.log(response.data.name.username); 
        const name = document.getElementById('your-name');
        name.innerHTML = `${response.data.name.username}`; 

        const groupsList = document.getElementById('groups-list');
        groupsList.innerHTML = '';  

        if (!response.data.groups) { 
            const noGroupsMessage = document.createElement('li');
            noGroupsMessage.textContent = 'No groups available';
            groupsList.appendChild(noGroupsMessage);
        } else {
            response.data.groups.forEach(group => {
                const groupItem = document.createElement('li');
                groupItem.textContent = `${group.name}`;  
                groupItem.addEventListener('click', () => {
                    selectGroup(group.id);  // When clicked, select the group
                    fetchActiveUsers(group.id)
                });
                groupsList.appendChild(groupItem);
            });
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Select a group and fetch its messages
async function selectGroup(groupId) {
    selectedGroupId = groupId;

    try {
        const response = await axios.get('http://localhost:9000/groups/messages', {
            headers: { 'Authorization': token },
            params: { groupId }  
        });
        
        renderMessages(response.data.messages);  // Display previous messages
        socket.emit('joinGroup', groupId);  // Join the specific group room
    } catch (error) {
        console.error('Error loading messages for group:', error);
    }
}

// Send a text message to the group
const sendMessageInGroup = async () => {
    const message = document.getElementById("message").value;
    
    if (selectedGroupId === null) {
        console.error("No group selected. Please select a group first.");
        return;  
    }

    if (message.trim() !== "") {
        try {
            const response = await axios.post(
                "http://localhost:9000/groups/sendMessage",  
                {
                    message: message,
                    group_id: selectedGroupId  
                },
                { headers: { 'Authorization': token } }
            );

            console.log('Message sent successfully:', response.data);

            // Emit the message to the group room
            socket.emit('sendMessage', { 
                groupId: selectedGroupId, 
                message, 
                userName: response.data.message.user_name 
            });

            document.getElementById("message").value = ""; 
            selectGroup(selectedGroupId); // Refresh group messages after sending
        } catch (error) {
            console.error("Error sending message to DB:", error);
        }
    }
};

// Send a multimedia message (file) to the group
async function sendMultimediaInGroup(fileName) {
    if (selectedGroupId === null) {
        console.error("No group selected. Please select a group first.");
        return;  
    }

    if (fileName.trim() !== "") {
        try {
            const response = await axios.post(
                "http://localhost:9000/groups/sendMultimedia",
                {
                    message: fileName,  
                    group_id: selectedGroupId  
                },
                { headers: { 'Authorization': token } }
            );

            console.log('Message sent successfully:', response.data.message.message);
            // Emit the message to the group room
            socket.emit('sendMessage', { 
                groupId: selectedGroupId, 
                message:response.data.message.message, 
                userName: response.data.message.user_name 
            });

            document.getElementById("message").value = "";  
            
            selectGroup(selectedGroupId); // Refresh group messages after sending
        } catch (error) {
            console.error("Error sending message to DB:", error);
        }
    }
};

// Fetch all messages from the selected group
async function fetchMessagesfromGroup() {
    try {
        const groupId = selectedGroupId;
        
        const response = await axios.get("http://localhost:9000/groups/messages", {
            headers: { 'Authorization': token },
            params: { groupId }  
        });
        
        const messages = response.data.messages;
        if (messages.length > 0) {
            renderMessages(messages);  // Render the messages in the UI
        } else {
            console.log('No messages found for this group.');
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
}

// Render messages in the UI
function renderMessages(messages) {
    const messagesContainer = document.getElementById("messages");
    messagesContainer.innerHTML = '';  // Clear existing messages
    
    messages.forEach((message) => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${message.user_name}: ${message.message}`;
        messagesContainer.appendChild(messageElement);


        // Scroll to the bottom to show the newest message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Load groups and messages when page loads
window.onload = function () {
    //fetchMessagesfromGroup();  // Fetch messages when page loads
    loadGroups();  // Load groups when page loads
};

// Send a message when "Send" button is clicked
document.getElementById("send-btn").addEventListener("click", sendMessageInGroup);

// Upload a file (multimedia message)
document.getElementById('upload-btn').addEventListener('click', async function(e) {
    e.preventDefault(); // Prevent form submission
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0]; // Get the selected file

    if (!file) {
        alert("Please select a file to upload");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const { filePath } = response.data;
        console.log('File uploaded successfully:', response.data);
        sendMultimediaInGroup(filePath);  // Send the file path as a multimedia message
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
    }
});

// Create a new group
document.getElementById('create-group-btn').addEventListener('click', async () => {
    const groupName = prompt('Enter group name:');
    if (groupName) {
        try {
            await axios.post('http://localhost:9000/groups/create', { name: groupName }, {
                headers: { 'Authorization': token }
            });
            loadGroups();  
        } catch (error) {
            console.error('Error creating group:', error);
        }
    }
});

// invite users to group
document.getElementById('invite-users-btn').addEventListener('click', async () => {
    const groupName = prompt('Enter group name:');
    const userName = prompt('Enter member name:');
    if (groupName) {
        try {
            await axios.post('http://localhost:9000/groups/invite', {groupName,userName }, {
                headers: { 'Authorization': token }
            });
            alert("User Added Successfully!")
            const groupId=response.data.group_id
            console.log(response.data)
            //join grp
            socket.on('joinGroup', (groupId) => {
                console.log(`User joined group: ${groupId}`);
                socket.emit('joinGroup', groupId);  // Join the group by groupId
            });
            


            loadGroups();  
        } catch (error) {
            console.error('Error creating group:', error);
        }
    }
});


// remove user
document.getElementById('remove-users-btn').addEventListener('click', async () => {
    const groupName = prompt('Enter group name:');
    const userName = prompt('Enter member name:');
    if (groupName) {
        try {
            await axios.post('http://localhost:9000/groups/remove', {groupName,userName }, {
                headers: { 'Authorization': token }
            });
            alert("User Removed Successfully!")
            loadGroups();  
        } catch (error) {
            console.error('Error creating group:', error);
        }
    }
});

// make admin
document.getElementById('make-admin-btn').addEventListener('click', async () => {
    const groupName = prompt('Enter group name:');
    const userName = prompt('Enter member name:');
    if (groupName) {
        try {
            await axios.post('http://localhost:9000/groups/makeadmin', {groupName,userName }, {
                headers: { 'Authorization': token }
            });
            alert("User made Admin Successfully!")
            loadGroups();  
        } catch (error) {
            console.error('Error creating group:', error);
        }
    }
});

async function fetchActiveUsers(groupId) {

    selectedGroupId = groupId
    try {
        const response = await axios.get("http://localhost:9000/groups/active-users", {
            headers: {
                'Authorization': token

            },
            params: { selectedGroupId }
        });
        
       
        if(!response.data.users){
            usersList.innerHTML = '';
        }
        const usersList = document.getElementById("users");
        usersList.innerHTML = ''; 

        response.data.users.forEach(user => {
            const userItem = document.createElement("li");
            userItem.textContent = `${user.username} `;
            usersList.appendChild(userItem);
        });
    } catch (error) {
        console.error("Error fetching active users:", error);
    }
}

fetchActiveUsers();