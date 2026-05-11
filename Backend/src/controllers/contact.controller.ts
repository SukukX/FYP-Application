import { Request, Response } from "express";
import { EmailService } from "../services/email.service";

/**
 * [ACTION] Submit Contact Form
 * Flow: Frontend Form -> Validate Body -> Send Email to Admin -> Return Success
 */
export const submitContactForm = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            res.status(400).json({ message: "Name, email, and message are required." });
            return;
        }

        // Use the EmailService to dispatch the contact email
        await EmailService.sendContactEmail(name, email, phone || "", message);

        res.status(200).json({ message: "Message sent successfully" });
    } catch (error: any) {
        console.error("Contact Form Error:", error);
        res.status(500).json({ message: "Failed to send message. Please try again later." });
    }
};
