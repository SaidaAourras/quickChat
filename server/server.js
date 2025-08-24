import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// create Express app and http server

const app = express();
const server = http.createServer(app);

//Initialize socket.io server

export const io = new Server(server, {
  cors: { origin: "*" },
});

// Store online users
export const userSocketMap = {}; //{userId:socketId}

//socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected ", userId);
  if (userId) userSocketMap[userId] = socket.id;

  // emit online users to all connected client

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//middleware setup
app.use(express.json({ limit: "4mb" })); // “Whenever a request comes in with JSON in the body, automatically read it and make it available in req.body — but don’t allow it to be bigger than 4 megabytes.”
app.use(cors()); // == “Allow requests from any origin.”

//Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
//connect to MongoDB

await connectDB();

if (process.env.NODE_ENV != "production") {
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => console.log("server is running on PORT :" + PORT));
}

// export server for vercel

export default server;
