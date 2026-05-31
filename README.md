# 💬 CHATTER – Real‑Time Private Chat App  
### (My Summer Mentorship Project under BIT MESRA 2025)

CHATTER is a full‑stack real‑time messaging application that lets you **sign up, verify your email, and chat privately** with other registered users. You can log in using a **password** or a **one‑time password (OTP) sent to your real email** – just like JioHotstar. It has live typing indicators, online/offline status, and a clean WhatsApp‑style interface.

---

##  Features

- **User authentication**
  - Sign up with name, email, and password
  - Email verification via 6‑digit OTP (sent to **your real inbox**)
  - Login with **email + password** OR **email + OTP** (passwordless)
  - Forgot password flow (reset via OTP)
  - Auto‑login using stored JWT token (session persistence)

- **Real‑time private messaging**
  - One‑to‑one chat with any registered user
  - Messages delivered instantly via WebSockets (Socket.io)
  - Full message history – load older chats when you open a conversation

- **User interface**
  - Search users by name or email
  - Online / offline indicator (green / grey dot)
  - WhatsApp‑style message bubbles:
    - **Sent messages** – green bubble on the **right**
    - **Received messages** – dark grey bubble on the **left**, showing the sender’s name
  - Typing indicator (“User is typing...”)
  - Profile dropdown (top‑left corner) showing your name, email, and a **Logout** button

- **Technology stack**
  - **Backend**: Node.js, Express, Socket.io
  - **Database**: MongoDB (lightweight)
  - **Authentication**: JWT (JSON Web Tokens), bcrypt for password hashing
  - **Email**: Resend (sends real OTPs to real email addresses)
  - **Frontend**: HTML5, CSS3, vanilla JavaScript (no frameworks)

---

 **Just Open the App**
   https://chatter-bay.vercel.app/   

/// YOU ARE GOOD TO GO ///
///      SUIIIIII     ///