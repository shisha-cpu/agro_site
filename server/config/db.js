const mongoose = require('mongoose');
//mongodb+srv://dsiclubmail:U0wWeF4Uq6dMk54F@cluster0.erg2qgj.mongodb.net/Agro?retryWrites=true&w=majority&appName=Cluster0
const connectDB = async () => {
  try {
    await mongoose 
    .connect( process.env.MONGODB_URI) 
     .then(()=> console.log('DB okey')) 
     .catch((err)=> console.log('db error' , err))
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;