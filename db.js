const mongoose = require("mongoose");

// 1. Define Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    verified: { type: Boolean, default: false } // We can drop this later if you ditch OTP
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true }
}, { timestamps: true });

// 2. Create Models
const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

// 3. Database Connection
async function initDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

// 4. Database Operations
async function getUserByEmail(email) {
    return await User.findOne({ email });
}

async function getUserById(id) {
    return await User.findById(id).select('-password');
}

async function createUser(email, hashedPassword, name) {
    const user = new User({ email, password: hashedPassword, name, verified: false });
    await user.save();
    return user._id;
}

async function verifyUserEmail(email) {
    await User.updateOne({ email }, { verified: true });
}

async function updateUserPassword(email, hashedPassword) {
    await User.updateOne({ email }, { password: hashedPassword });
}

async function saveMessage(fromUserId, toUserId, messageText) {
    const msg = new Message({
        from_user: fromUserId,
        to_user: toUserId,
        message: messageText
    });
    await msg.save();
    return { id: msg._id, timestamp: msg.createdAt };
}

async function getMessagesBetweenUsers(user1, user2) {
    const messages = await Message.find({
        $or: [
            { from_user: user1, to_user: user2 },
            { from_user: user2, to_user: user1 }
        ]
    })
        .sort({ createdAt: 1 })
        .populate('from_user', 'name'); // Joins the user table to get the sender's name

    // Map it to match the exact format your frontend currently expects
    return messages.map(msg => ({
        id: msg._id,
        from_user: msg.from_user._id,
        to_user: msg.to_user,
        message: msg.message,
        timestamp: msg.createdAt,
        fromName: msg.from_user.name
    }));
}

async function searchUsers(query, excludeUserId) {
    return await User.find({
        _id: { $ne: excludeUserId },
        $or: [
            { email: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
        ]
    }).select('id email name').limit(20);
}

async function getAllUsersExcept(userId) {
    return await User.find({ _id: { $ne: userId } })
        .select('id email name')
        .sort({ name: 1 });
}

module.exports = {
    initDb,
    getUserByEmail,
    getUserById,
    createUser,
    verifyUserEmail,
    updateUserPassword,
    saveMessage,
    getMessagesBetweenUsers,
    searchUsers,
    getAllUsersExcept,
};