const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    verified: { type: Boolean, default: false }
},
    { timestamps: true });

const messageSchema = new mongoose.Schema({
    from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true }
},
    { timestamps: true });

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

async function initDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

async function getUserByEmail(email) {
    return await User.findOne({ email }).select('-password');
}

async function getUserById(id) {
    return await User.findById(id).select('-password');
}

async function createUser(email, hashedPassword, name) {
    const user = new User({ email, password: hashedPassword, name, verified: true });
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
        from_user: new mongoose.Types.ObjectId(fromUserId),
        to_user: new mongoose.Types.ObjectId(toUserId),
        message: messageText
    });
    await msg.save();
    return { id: msg._id.toString(), timestamp: msg.createdAt };
}

async function getMessagesBetweenUsers(user1, user2) {
    const messages = await Message.find({
        $or: [
            { from_user: user1, to_user: user2 },
            { from_user: user2, to_user: user1 }
        ]
    })
        .sort({ createdAt: 1 })
        .populate('from_user', 'name');

    return messages.map(msg => ({
        id: msg._id.toString(),
        from_user: msg.from_user._id.toString(),
        to_user: msg.to_user.toString(),
        message: msg.message,
        timestamp: msg.createdAt,
        fromName: msg.from_user.name
    }));
}

async function searchUsers(query, excludeUserId) {
    const users = await User.find({
        _id: { $ne: excludeUserId },
        name: { $regex: query, $options: 'i' }
    }).limit(20);

    return users.map(u => ({
        id: u._id.toString(),
        name: u.name
    }));
}

async function getAllUsersExcept(userId) {
    const users = await User.find({ _id: { $ne: userId } }).sort({ name: 1 });

    return users.map(u => ({
        id: u._id.toString(),
        name: u.name
    }));
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