
const express= require("express");
const http = require("http")
const path = require("path")
require('./cron-job/archiveOldChats');  // This will start the cron
const bodyParser= require("body-parser")
const sequelize= require("./util/database")
const jwt = require('jsonwebtoken');
const userRoutes= require("./routes/userRouter")
const groupRoutes= require("./routes/groupRoutes")

const multer= require("multer")
const cron = require("cron");
const fetch = require("node-fetch"); 
 

const app = express(); 

const storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
      return cb(null, './uploads')
    },  
    filename: function (req, file, cb) {
      
      return cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
  
  const upload = multer({ storage: storage })

const server = http.createServer(app);
server.listen(9000,()=> console.log('Server is running on http://localhost:9000')) 

const { Server } = require("socket.io");
const io = new Server(server); // io will handle all our sockets and express will handle http requests

     

    
io.on("connection", (socket) => {
    console.log("A user connected");

    // User joins a group room
    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);  // Join a specific room for the group
        console.log(`User joined group: ${groupId}`);
    });

    // Listen for messages to be sent to the group
    socket.on('sendMessage', (messageData) => {
        const { groupId, message, userName } = messageData;
        
        // Emit the message to the specific group room only
        socket.to(groupId).emit('newMessage', { message, userName });
        console.log(`Message sent to group ${groupId}: ${message}`);
    });

    // User disconnects
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});
var cors= require("cors");
 

app.use(cors({
    origin: "*",  // Allow all origins 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow all methods 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  })); 
 

app.use(bodyParser.json());
app.use(express.urlencoded({extended: false})); 
app.use(express.static(path.join(__dirname,"Public"))); 




app.use("/user",userRoutes);  

app.use('/groups', groupRoutes);

app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        const filePath = req.file.path; 
        console.log('File uploaded:', req.file);

        

        res.status(200).send({ message: 'File uploaded successfully', filePath : filePath });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send({ message: 'Error uploading file' });
    }
});




 app.get('*', (req, res) => {
    const requestedUrl = req.url;
    
    

    if (requestedUrl.startsWith('/socket.io/')) {
        return;
        
    }

    if (requestedUrl.startsWith('/views/')) {
        
        const filePath = path.join(__dirname, 'views', requestedUrl.slice(7)+'.html');
        

        
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error serving file:', err); 
                res.status(404).send('File Not Found'); 
            }
        });
    } 
    
    else{
        
        if(requestedUrl.startsWith('/css/')) {
        
        const publicPath = path.join(__dirname, 'Public', requestedUrl+'.css'); 
        
        res.sendFile(publicPath, (err) => { 
             
            if (err) {
                console.error('Error serving file:', err); 
                res.status(404).send('File Not Found');
            }
        });  
    }
    else {
        
        const publicPath = path.join(__dirname, 'Public','js', requestedUrl+'.js');
        
        res.sendFile(publicPath, (err) => {  
             
            if (err) { 
                console.error('Error serving file:', err); 
                res.status(404).send('File Not Found');  
            }
        });   
    }
} 
});

sequelize
.sync({force:false})
.then(result=>{
    console.log('Database synced!'); 
    //app.listen(process.env.PORT || 9000,()=>{console.log(`Server is running on http://localhost:${process.env.PORT || 9000}`)});
})
.catch(err=>{
    console.log(err) 
});  