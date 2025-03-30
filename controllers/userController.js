require('dotenv').config();
const User = require("../models/userModel")
const bcrypt = require("bcrypt");
const jwt= require("jsonwebtoken");



exports.signUp = async (req,res)=>{
    try{
    const username = req.body.username;
    const email = req.body.email;
    const phone= req.body.phone;
    const password= req.body.password;

    if(!username || !email || !password){
        return res.status(400).json({err: 'Bad Parameters . Something is missing'})
    }


    
    const existingUser = await User.findOne({
        where: { email: email }
      });
  
      if (existingUser) {
        
        return res.status(409).json({ err: 'User already exists, Please Login' });
      }


    const saltrounds=10;
    bcrypt.hash(password, saltrounds, async(err,hash)=>{
        console.log(err)
        const newUser = await User.create({
            username:username, 
            email :email, 
            password:hash,
            phone:phone});
    
        res.status(201).json({message :"Successfully created new user"})
    })
    
}
catch(err){
    console.log("Error adding User")
        res.status(500).json({error: err.message});
    }
}




function generateAccessToken(id,name){
    return jwt.sign({userId : id, name : name},process.env.TOKEN)
}



exports.logIn = async (req,res)=>{
    try{
    
    const email = req.body.email;
    const password= req.body.password;

    if( !email || !password){
        return res.status(400).json({err: 'Email or Password is missing'})
    }

    const user = await User.findAll({
        where : {email}});

    
    if(user.length>0){
        bcrypt.compare(password, user[0].password,(err,result)=>{
            if(err){
                throw new Error("Something went wrong!") //error in decryption

            }
            if(result==true){
                res.status(200).json({success: true,message :"Successfully Logged In", token : generateAccessToken(user[0].id, user[0].username), isPremium:user[0].isPremium}) //password match

            }
            else{
                return res.status(401).json({success : false,message :"User not authorized!"}) // password does not match

            }

        })
    } else{
        return res.status(404).json({success:false, message :"User does not exist!"})
    }

    
}
catch(err){
    console.log("Error Logging In", err.message)
        res.status(500).json({error: err.message});
    }
}

