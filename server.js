const express = require("express");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("./email");
const { initDb, getUserByEmail, createUser, getUserById, getMessagesBetweenUsers, saveMessage, searchUsers, updateUserPassword, verifyUserEmail, getAllUsersExcept } = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || "chatter-secure-jwt-secret-key-2026";
const OTP_EXPIRY = 10 * 60 * 1000;

const otpStore = new Map();

app.use(express.json());
app.use(express.static(__dirname));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return next(new Error("Invalid token"));
        socket.user = user;
        next();
    });
});

const userSockets = new Map();
const onlineUsers = new Set();

app.post("/api/signup", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: "All fields required" });
    }

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await createUser(email, hashedPassword, name);

        const otp = crypto.randomInt(100000, 999999).toString();
        otpStore.set(email, { otp, expires: Date.now() + OTP_EXPIRY, type: "signup" });

        await sendEmail(email, "Verify Your Email", `Your verification OTP is: ${otp}. Valid for 10 minutes.`);

        res.json({ message: "User created. Please verify email with OTP sent.", userId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires || record.type !== "signup") {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await verifyUserEmail(email);
    otpStore.delete(email);
    res.json({ message: "Email verified successfully" });
});

app.post("/api/send-login-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        const user = await getUserByEmail(email);
        if (!user || !user.verified) {
            return res.status(404).json({ error: "User not found or email not verified" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        otpStore.set(email, { otp, expires: Date.now() + OTP_EXPIRY, type: "login" });
        await sendEmail(email, "Login OTP", `Your login OTP is: ${otp}. Valid for 10 minutes.`);
        res.json({ message: "OTP sent to email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/login-with-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires || record.type !== "login") {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.verified) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id.toString(), name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    otpStore.delete(email);
    res.json({ token, user: { id: user._id.toString(), name: user.name } });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const user = await getUserByEmail(email);
        if (!user || !user.verified) {
            return res.status(401).json({ error: "Invalid credentials or email not verified" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id.toString(), name: user.name }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user._id.toString(), name: user.name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expires: Date.now() + OTP_EXPIRY, type: "reset" });
    await sendEmail(email, "Password Reset OTP", `Your password reset OTP is: ${otp}. Valid for 10 minutes.`);
    res.json({ message: "OTP sent to email" });
});

app.post("/api/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires || record.type !== "reset") {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, hashedPassword);
    otpStore.delete(email);
    res.json({ message: "Password reset successful" });
});

app.get("/api/users/search", authenticateToken, async (req, res) => {
    const query = req.query.q;
    const currentUserId = req.user.id;

    if (!query || query.trim() === "") {
        const allUsers = await getAllUsersExcept(currentUserId);
        return res.json(allUsers);
    }

    const users = await searchUsers(query, currentUserId);
    res.json(users);
});

app.get("/api/messages/:userId", authenticateToken, async (req, res) => {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.id;
    const messages = await getMessagesBetweenUsers(currentUserId, otherUserId);
    res.json(messages);
});

app.get("/api/verify-token", authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

io.on("connection", (socket) => {
    const userId = socket.user.id;
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);

    const onlineUsersList = Array.from(onlineUsers).map(id => ({ id }));
    socket.emit("online users", onlineUsersList);
    socket.broadcast.emit("user online", { userId, name: socket.user.name });

    socket.on("private message", async (data) => {
        const { toUserId, message } = data;
        const fromUserId = userId;

        const savedMsg = await saveMessage(fromUserId, toUserId, message);
        const recipientSocketId = userSockets.get(toUserId);

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("private message", {
                id: savedMsg.id,
                fromUserId,
                fromName: socket.user.name,
                message,
                timestamp: savedMsg.timestamp
            });
        }

        socket.emit("message sent", {
            id: savedMsg.id,
            toUserId,
            message,
            timestamp: savedMsg.timestamp
        });
    });

    socket.on("typing", (data) => {
        const { toUserId, isTyping } = data;
        const recipientSocketId = userSockets.get(toUserId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("user typing", {
                fromUserId: userId,
                fromName: socket.user.name,
                isTyping
            });
        }
    });

    socket.on("disconnect", () => {
        userSockets.delete(userId);
        onlineUsers.delete(userId);
        socket.broadcast.emit("user offline", { userId });
    });
});

initDb().then(() => {
    server.listen(3000, () => {
        console.log("Server running on http://localhost:3000");
    });
});