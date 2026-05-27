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
  - **Database**: SQLite (lightweight, file‑based)
  - **Authentication**: JWT (JSON Web Tokens), bcrypt for password hashing
  - **Email**: Resend (sends real OTPs to real email addresses)
  - **Frontend**: HTML5, CSS3, vanilla JavaScript (no frameworks)

---

##  How to Run Locally (No Hosting Required)

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or later)
- npm (comes with Node.js)
- A free [Resend](https://resend.com) account (to send real OTPs)

### Step‑by‑Step Setup

1. **Clone or download the project**  
   Place all files (`server.js`, `db.js`, `email.js`, `user.js`, `index.html`, `app.css`, `package.json`) in a folder.

2. **Install dependencies**  
   Open a terminal in that folder and run:
   ```bash
   npm install
3. **Get your Resend API key**

    Go to resend.com and sign up.
    In your dashboard, go to API Keys → Create API Key.
    Copy the key (it starts with re_...).

3. **Create a .env and write your secret key**  
    JJWT_SECRET=your_super_secret_key_(change this according to your preference )
    RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

4. **Just run he Server**
    In your Terminal do node server.js
    You will see this - 

    Server running on http://localhost:3000
    Email configured with Ethereal test account
    Preview URL: https://ethereal.email/login   

 5. **Open the App**
    Visit http://localhost:3000 in your browser.   

/// YOU ARE GOOD TO GO ///
///      SUIIIIII     ///