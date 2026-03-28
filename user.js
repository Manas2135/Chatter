const socket = io();

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");

function sendMessage() {
    const msg = input.value;
    if (msg.trim() === "") return;

    appendMessage(msg, "right");
    socket.emit("chat message", msg);

    input.value = "";
}

socket.on("chat message", (msg) => {
    appendMessage(msg, "left");
});

function appendMessage(msg, side) {
    const div = document.createElement("div");
    div.classList.add("message", side);
    div.innerText = msg;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}