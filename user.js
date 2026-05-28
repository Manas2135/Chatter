const BACKEND_URL = "https://chatter-65m4.onrender.com";
let socket = null;
let currentUser = null;
let currentChatUser = null;
let typingTimeout = null;

const authOverlay = document.getElementById("authOverlay");
const chatApp = document.getElementById("chatApp");
const profileIcon = document.getElementById("profileIcon");
const dropdownMenu = document.getElementById("dropdownMenu");
const profileInitial = document.getElementById("profileInitial");
const userNameSpan = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const userListDiv = document.getElementById("userList");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatHeader = document.getElementById("chatHeader");
const inputContainer = document.getElementById("inputContainer");
const typingIndicator = document.getElementById("typingIndicator");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const otpForm = document.getElementById("otpForm");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");

const otpLoginSection = document.getElementById("otpLoginSection");
const showOtpLoginBtn = document.getElementById("showOtpLoginBtn");
const backToPasswordLogin = document.getElementById("backToPasswordLogin");
const loginOtpEmail = document.getElementById("loginOtpEmail");
const sendLoginOtpBtn = document.getElementById("sendLoginOtpBtn");
const loginOtpCode = document.getElementById("loginOtpCode");
const verifyLoginOtpBtn = document.getElementById("verifyLoginOtpBtn");
const loginOtpError = document.getElementById("loginOtpError");

let pendingEmail = "";
let onlineUserIds = new Set();

showOtpLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    otpLoginSection.style.display = "block";
});

backToPasswordLogin.addEventListener("click", (e) => {
    e.preventDefault();
    otpLoginSection.style.display = "none";
    loginForm.style.display = "block";
});

sendLoginOtpBtn.addEventListener("click", async () => {
    const email = loginOtpEmail.value.trim();
    if (!email) {
        loginOtpError.textContent = "Please enter your email";
        return;
    }
    loginOtpError.textContent = "";
    sendLoginOtpBtn.disabled = true;

    try {
        const res = await fetch(`${BACKEND_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        alert("OTP sent to your email.");
        document.getElementById("loginOtpGroup").style.display = "block";
        verifyLoginOtpBtn.style.display = "block";
    } catch (err) {
        loginOtpError.textContent = err.message;
    } finally {
        sendLoginOtpBtn.disabled = false;
    }
});

verifyLoginOtpBtn.addEventListener("click", async () => {
    const email = loginOtpEmail.value.trim();
    const otp = loginOtpCode.value.trim();
    if (!email || !otp) {
        loginOtpError.textContent = "Email and OTP required";
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem("token", data.token);
        currentUser = data.user;
        initChatApp();
    } catch (err) {
        loginOtpError.textContent = err.message;
    }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorDiv = document.getElementById("loginError");

    try {
        const res = await fetch(`${BACKEND_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem("token", data.token);
        currentUser = data.user;
        initChatApp();
    } catch (err) {
        errorDiv.textContent = err.message;
    }
});

document.getElementById("signupBtn").addEventListener("click", async () => {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const errorDiv = document.getElementById("signupError");

    if (!name || !email || !password) {
        errorDiv.textContent = "All fields required";
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        pendingEmail = email;
        showOtpForm(email);
    } catch (err) {
        errorDiv.textContent = err.message;
    }
});

document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
    const otp = document.getElementById("otpCode").value;
    const errorDiv = document.getElementById("otpError");

    try {
        const res = await fetch(`${BACKEND_URL}/api/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmail, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert("Email verified! Please login.");
        showLoginForm();
    } catch (err) {
        errorDiv.textContent = err.message;
    }
});

document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
    e.preventDefault();
    showForgotForm();
});

document.getElementById("sendResetOtpBtn").addEventListener("click", async () => {
    const email = document.getElementById("forgotEmail").value;
    const errorDiv = document.getElementById("forgotError");

    try {
        const res = await fetch(`${BACKEND_URL}/api/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        pendingEmail = email;
        showResetForm();
    } catch (err) {
        errorDiv.textContent = err.message;
    }
});

document.getElementById("resetPasswordBtn").addEventListener("click", async () => {
    const otp = document.getElementById("resetOtp").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const errorDiv = document.getElementById("resetError");

    if (newPassword !== confirm) {
        errorDiv.textContent = "Passwords do not match";
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmail, otp, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert("Password reset successful! Please login.");
        showLoginForm();
    } catch (err) {
        errorDiv.textContent = err.message;
    }
});

document.getElementById("backToLogin").addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
});

function showOtpForm(email) {
    document.querySelectorAll(".auth-form").forEach(f => f.style.display = "none");
    otpForm.style.display = "block";
    document.getElementById("otpEmail").textContent = email;
}

function showLoginForm() {
    document.querySelectorAll(".auth-form").forEach(f => f.style.display = "none");
    loginForm.style.display = "block";
    loginForm.classList.add("active");
    otpLoginSection.style.display = "none";
}

function showForgotForm() {
    document.querySelectorAll(".auth-form").forEach(f => f.style.display = "none");
    forgotForm.style.display = "block";
}

function showResetForm() {
    document.querySelectorAll(".auth-form").forEach(f => f.style.display = "none");
    resetForm.style.display = "block";
}

async function initChatApp() {
    authOverlay.style.display = "none";
    chatApp.style.display = "flex";

    profileInitial.textContent = currentUser.name.charAt(0).toUpperCase();
    userNameSpan.textContent = currentUser.name;

    const token = localStorage.getItem("token");
    socket = io(BACKEND_URL, {
        auth: { token },
        transports: ["websocket"]
    });

    socket.on("private message", (msg) => {
        if (currentChatUser && msg.fromUserId === currentChatUser.id) {
            appendMessage(msg.message, "received", msg.fromName);
        }
    });

    socket.on("user typing", (data) => {
        if (currentChatUser && data.fromUserId === currentChatUser.id) {
            typingIndicator.textContent = data.isTyping ? `${data.fromName} is typing...` : "";
        }
    });

    socket.on("user online", (user) => {
        onlineUserIds.add(user.userId);
        updateOnlineDot(user.userId, true);
    });

    socket.on("user offline", (user) => {
        onlineUserIds.delete(user.userId);
        updateOnlineDot(user.userId, false);
    });

    socket.on("online users", (users) => {
        onlineUserIds.clear();
        users.forEach(u => onlineUserIds.add(u.id));
        loadUsers(searchInput.value);
    });

    await loadUsers();

    searchInput.addEventListener("input", debounce(() => {
        loadUsers(searchInput.value);
    }, 300));

    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
        if (currentChatUser) {
            socket.emit("typing", { toUserId: currentChatUser.id, isTyping: true });
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                socket.emit("typing", { toUserId: currentChatUser.id, isTyping: false });
            }, 1000);
        }
    });
}

function updateOnlineDot(userId, isOnline) {
    const userItem = document.querySelector(`.user-item[data-user-id="${userId}"]`);
    if (userItem) {
        const dot = userItem.querySelector(".online-dot");
        if (dot) dot.style.background = isOnline ? "#4ecdc4" : "#444";
    }
}

async function loadUsers(searchQuery = "") {
    const token = localStorage.getItem("token");
    let url = `${BACKEND_URL}/api/users/search?q=` + encodeURIComponent(searchQuery);

    try {
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const users = await res.json();

        if (!users || users.length === 0) {
            userListDiv.innerHTML = '<div style="padding:15px; text-align:center; color:var(--text-secondary);">No users found</div>';
            return;
        }

        userListDiv.innerHTML = users.map(user => `
            <div class="user-item" data-user-id="${user.id}" data-user-name="${user.name}">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <div class="user-name">${escapeHtml(user.name)}</div>
                </div>
                <div class="online-dot" style="background: ${onlineUserIds.has(user.id) ? '#4ecdc4' : '#444'}"></div>
            </div>
        `).join("");

        document.querySelectorAll(".user-item").forEach(el => {
            el.addEventListener("click", () => {
                selectUser({ id: el.dataset.userId, name: el.dataset.userName });
            });
        });
    } catch (err) {
        console.error(err);
    }
}

async function selectUser(user) {
    currentChatUser = user;
    chatHeader.innerHTML = `<h3>Chat with ${escapeHtml(user.name)}</h3>`;
    inputContainer.style.display = "block";
    messagesDiv.innerHTML = "";

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${BACKEND_URL}/api/messages/${user.id}`, { headers: { "Authorization": `Bearer ${token}` } });
        const messages = await res.json();

        messages.forEach(msg => {
            const isSent = msg.from_user === currentUser.id;
            appendMessage(msg.message, isSent ? "sent" : "received", isSent ? "You" : msg.fromName);
        });
        scrollToBottom();
    } catch (err) {
        console.error(err);
    }
}

function sendMessage() {
    const msg = messageInput.value.trim();
    if (!msg || !currentChatUser) return;

    appendMessage(msg, "sent", "You");
    socket.emit("private message", { toUserId: currentChatUser.id, message: msg });
    messageInput.value = "";
    scrollToBottom();
}

function appendMessage(msg, type, senderName) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderHtml = type === "received" ? `<div class="sender-name">${escapeHtml(senderName)}</div>` : "";

    messageDiv.innerHTML = `
        ${senderHtml}
        <div class="message-text">${escapeHtml(msg)}</div>
        <div class="timestamp">${timeStr}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.querySelector(".messages-container");
    container.scrollTop = container.scrollHeight;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

profileIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
});

document.addEventListener("click", () => { dropdownMenu.classList.remove("show"); });

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    if (socket) socket.disconnect();
    location.reload();
});

window.addEventListener("load", async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${BACKEND_URL}/api/verify-token`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Invalid token");
        const data = await res.json();
        currentUser = data.user;
        initChatApp();
    } catch (err) {
        localStorage.removeItem("token");
    }
});

document.getElementById("goToSignupBtn").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".auth-form").forEach(f => { f.style.display = "none"; f.classList.remove("active"); });
    otpLoginSection.style.display = "none";
    signupForm.style.display = "flex";
    signupForm.classList.add("active");
});

document.getElementById("goToLoginBtn").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".auth-form").forEach(f => { f.style.display = "none"; f.classList.remove("active"); });
    loginForm.style.display = "flex";
    loginForm.classList.add("active");
});