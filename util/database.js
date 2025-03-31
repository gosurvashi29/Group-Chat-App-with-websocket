require('dotenv').config();
/*const Sequelize  = require("sequelize");

const sequelize= new Sequelize(process.env.DB_NAME, process.env.DB_USER , process.env.DB_PASSWORD,{
    
    dialect : process.env.DB_DIALECT,
    
    host: process.env.RDS_ENDPOINT
})
*/


const Sequelize  = require("sequelize");

const sequelize= new Sequelize('group_chat', 'root' , 'admin1234',{
    dialect : 'mysql',
    host: 'localhost'
})


module.exports=sequelize;