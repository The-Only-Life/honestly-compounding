import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";
import Config from "../server.config";

const resend = Config.RESEND_API_KEY ? new Resend(Config.RESEND_API_KEY) : null;

export interface SendInviteEmailParams {
  to: string;
  inviteUrl: string;
}

// Load email templates
const TEMPLATES_DIR = join(__dirname, "../templates/emails");

function loadTemplate(templateName: string): string {
  const templatePath = join(TEMPLATES_DIR, `${templateName}.html`);
  return readFileSync(templatePath, "utf-8");
}

function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return rendered;
}

export async function sendInviteEmail({
  to,
  inviteUrl,
}: SendInviteEmailParams) {
  if (!resend) {
    console.warn("Resend API key not configured. Skipping email send.");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const template = loadTemplate("invite");
    const html = renderTemplate(template, {
      INVITE_URL: inviteUrl,
      USER_EMAIL: to,
      CURRENT_YEAR: new Date().getFullYear().toString(),
      LOGO_URL: `${Config.FRONTEND_URL}/Logo.png`,
    });

    const { data, error } = await resend.emails.send({
      from: Config.EMAIL_FROM,
      to: [to],
      subject: "You've been invited to Honestly Compounding",
      html,
    });

    if (error) {
      console.error("Failed to send email via Resend:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully via Resend:", data);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending email via Resend:", error);
    return { success: false, error: error.message };
  }
}

export async function sendWaitlistApprovalEmail({
  to,
  inviteUrl,
}: SendInviteEmailParams) {
  if (!resend) {
    console.warn("Resend API key not configured. Skipping email send.");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const template = loadTemplate("waitlist-approved");
    const html = renderTemplate(template, {
      INVITE_URL: inviteUrl,
      USER_EMAIL: to,
      CURRENT_YEAR: new Date().getFullYear().toString(),
      LOGO_URL: `${Config.FRONTEND_URL}/Logo.png`,
    });

    const { data, error } = await resend.emails.send({
      from: Config.EMAIL_FROM,
      to: [to],
      subject: "🎉 Waitlist Approved - Welcome to Honestly Compounding",
      html,
    });

    if (error) {
      console.error(
        "Failed to send waitlist approval email via Resend:",
        error
      );
      return { success: false, error: error.message };
    }

    console.log("Waitlist approval email sent successfully via Resend:", data);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending waitlist approval email via Resend:", error);
    return { success: false, error: error.message };
  }
}

export interface SendAccessApprovalEmailParams {
  to: string;
  dashboardUrl: string;
}

export async function sendAccessApprovalEmail({
  to,
  dashboardUrl,
}: SendAccessApprovalEmailParams) {
  if (!resend) {
    console.warn("Resend API key not configured. Skipping email send.");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const template = loadTemplate("access-approved");
    const html = renderTemplate(template, {
      DASHBOARD_URL: dashboardUrl,
      USER_EMAIL: to,
      CURRENT_YEAR: new Date().getFullYear().toString(),
      LOGO_URL: `${Config.FRONTEND_URL}/Logo.png`,
    });

    const { data, error } = await resend.emails.send({
      from: Config.EMAIL_FROM,
      to: [to],
      subject: "🎉 Access Granted - Welcome to Honestly Compounding",
      html,
    });

    if (error) {
      console.error(
        "Failed to send access approval email via Resend:",
        error
      );
      return { success: false, error: error.message };
    }

    console.log("Access approval email sent successfully via Resend:", data);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending access approval email via Resend:", error);
    return { success: false, error: error.message };
  }
}
