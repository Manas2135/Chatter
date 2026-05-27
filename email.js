const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

async function sendEmail(to, subject, text) {
    try {
        const { data, error } = await resend.emails.send({
            from: DEFAULT_FROM,
            to: [to],
            subject: subject,
            text: text,
        });

        if (error) {
            console.error("Resend error:", error);
            return false;
        }

        console.log(`Email sent to ${to} - ID: ${data?.id}`);
        return true;
    } catch (error) {
        console.error("Email sending failed:", error);
        return false;
    }
}

module.exports = { sendEmail };