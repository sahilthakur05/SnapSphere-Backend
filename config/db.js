const mongoose =require("mongoose")

const connectDb=async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`MongoDB Error: ${error.message}`);
      process.exit(1); // Stop the app if DB fails — no point running without data
    }
}

module.exports = connectDb