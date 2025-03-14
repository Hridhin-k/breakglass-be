import * as Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  throw new Error("Brevo API key is not configured in environment variables.");
}

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

interface EmailTemplate {
  subject: string;
  htmlContent: string;
}

const emailTemplates: { [key: string]: EmailTemplate } = {
  otp: {
    subject: "Your OTP for Account Approval",
    htmlContent: `<html><body><p>Your OTP is: <strong>{{otp}}</strong>. It will expire in 60 minutes.</p></body></html>`,
  },
  welcome: {
    subject: "Welcome to Our Platform",
    htmlContent: `<html><body><p>Dear {{username}}, welcome to our platform!</p></body></html>`,
  },
};

async function sendEmail(
  email: string,
  templateName: string,
  templateVariables: { [key: string]: string } = {}
) {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found.`);
  }

  // Replace template variables
  let htmlContent = template.htmlContent;
  for (const key in templateVariables) {
    htmlContent = htmlContent.replace(`{{${key}}}`, templateVariables[key]);
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = template.subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = {
    name: "BreakGlass Admin",
    email: "hridhinchembakasseri@gmail.com",
  };
  sendSmtpEmail.to = [{ email }];

  try {
    console.log(
      "Sending email with data:",
      JSON.stringify(sendSmtpEmail, null, 2)
    );
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", data);
  } catch (error: any) {
    console.error("Error sending email:", {
      message: error.message,
      stack: error.stack,
      responseData: error?.response?.data || null,
      responseStatus: error?.response?.status || null,
      config: error?.config || null,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export { sendEmail, emailTemplates };
