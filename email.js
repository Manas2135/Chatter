const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subject, text) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to} - Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("Nodemailer sending failed:", error);
        return false;
    }
}

module.exports = { sendEmail };