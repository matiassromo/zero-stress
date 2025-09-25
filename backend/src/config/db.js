import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // opciones si las necesitas
    });
    console.log("MongoDB conectado:", conn.connection.host);
  } catch (err) {
    console.error("Error de conexión MongoDB:", err.message);
    process.exit(1);
  }
};

export default connectDB;
