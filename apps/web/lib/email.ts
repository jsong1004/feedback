import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
});

export async function sendFeedbackNotification(
  menteeEmail: string,
  menteeName: string | null,
  mentorName: string | null,
  eventName: string
) {
  // In development, just log to console
  if (!process.env.SMTP_USER || process.env.NODE_ENV === "development") {
    console.log(
      `[EMAIL] Would send to ${menteeEmail}:`,
      `New feedback from ${mentorName || "your mentor"} for ${eventName}`
    );
    return { messageId: "dev-mode" };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: menteeEmail,
    subject: `New Feedback Received: ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Feedback Received</h2>
        <p>Hi ${menteeName || menteeEmail},</p>
        <p>You have received new feedback from <strong>${mentorName || "your mentor"}</strong> for the event:</p>
        <p style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 16px 0;">
          <strong>${eventName}</strong>
        </p>
        <p>Log in to your dashboard to view your feedback:</p>
        <a href="${process.env.NEXTAUTH_URL}/mentee/dashboard"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Feedback
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This is an automated email from the Mentorship Feedback Platform.
        </p>
      </div>
    `,
  });

  return info;
}

export async function sendFeedbackReminder(
  mentorEmail: string,
  mentorName: string | null,
  menteeName: string | null,
  eventName: string,
  eventId: string,
  menteeId: string
) {
  if (!process.env.SMTP_USER || process.env.NODE_ENV === "development") {
    console.log(
      `[EMAIL] Would send reminder to ${mentorEmail}:`,
      `Reminder to submit feedback for ${menteeName} in ${eventName}`
    );
    return { messageId: "dev-mode" };
  }

  const feedbackUrl = `${process.env.NEXTAUTH_URL}/mentor/events/${eventId}/mentees/${menteeId}/submit-feedback`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: mentorEmail,
    subject: `Reminder: Submit Feedback for ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Feedback Reminder</h2>
        <p>Hi ${mentorName || mentorEmail},</p>
        <p>This is a friendly reminder to submit feedback for:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Mentee:</strong> ${menteeName || "your mentee"}</p>
          <p style="margin: 4px 0;"><strong>Event:</strong> ${eventName}</p>
        </div>
        <p>Click below to submit your feedback:</p>
        <a href="${feedbackUrl}"
           style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Submit Feedback
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This is an automated email from the Mentorship Feedback Platform.
        </p>
      </div>
    `,
  });

  return info;
}

export async function sendAssignmentInvitation(
  email: string,
  eventName: string,
  eventStartDate: Date,
  eventEndDate: Date,
  role: "mentor" | "mentee"
) {
  if (!process.env.SMTP_USER || process.env.NODE_ENV === "development") {
    console.log(
      `[EMAIL] Would send invitation to ${email}:`,
      `You're invited as ${role} for ${eventName}`
    );
    return { messageId: "dev-mode" };
  }

  const signInUrl = `${process.env.NEXTAUTH_URL}/auth/signin`;
  const roleDisplay = role === "mentor" ? "Mentor" : "Mentee";

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `You're invited to ${eventName} as ${roleDisplay}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Mentorship Feedback Platform</h2>
        <p>Hi there,</p>
        <p>You've been invited to participate as a <strong>${roleDisplay}</strong> in the following mentorship event:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${eventName}</p>
          <p style="margin: 4px 0;"><strong>Start:</strong> ${eventStartDate.toLocaleDateString()} ${eventStartDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
          <p style="margin: 4px 0;"><strong>End:</strong> ${eventEndDate.toLocaleDateString()} ${eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
          <p style="margin: 4px 0;"><strong>Your Role:</strong> ${roleDisplay}</p>
        </div>
        <p>To get started, please sign in with your Google account:</p>
        <a href="${signInUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Sign In with Google
        </a>
        ${role === "mentor" ? `
          <div style="margin-top: 24px; padding: 16px; background: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #1e40af;">Next Steps for Mentors:</h3>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>Sign in to access your mentor dashboard</li>
              <li>Review your assigned mentees</li>
              <li>Submit feedback after mentorship sessions</li>
              <li>Track your submissions and progress</li>
            </ul>
          </div>
        ` : `
          <div style="margin-top: 24px; padding: 16px; background: #dcfce7; border-left: 4px solid #16a34a; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #15803d;">Next Steps for Mentees:</h3>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>Sign in to access your mentee dashboard</li>
              <li>View your assigned mentors</li>
              <li>Receive feedback from your mentors</li>
              <li>Track your progress and learnings</li>
            </ul>
          </div>
        `}
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This is an automated email from the Mentorship Feedback Platform.
        </p>
      </div>
    `,
  });

  return info;
}

export async function sendAssignmentNotification(
  email: string,
  name: string | null,
  eventName: string,
  eventStartDate: Date,
  eventEndDate: Date,
  role: "mentor" | "mentee",
  partnerName?: string
) {
  if (!process.env.SMTP_USER || process.env.NODE_ENV === "development") {
    console.log(
      `[EMAIL] Would send notification to ${email}:`,
      `New assignment as ${role} for ${eventName}`
    );
    return { messageId: "dev-mode" };
  }

  const dashboardUrl = role === "mentor"
    ? `${process.env.NEXTAUTH_URL}/mentor/dashboard`
    : `${process.env.NEXTAUTH_URL}/mentee/dashboard`;
  const roleDisplay = role === "mentor" ? "Mentor" : "Mentee";
  const partnerRole = role === "mentor" ? "Mentee" : "Mentor";

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `New Assignment: ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Mentorship Assignment</h2>
        <p>Hi ${name || email},</p>
        <p>You've been assigned as a <strong>${roleDisplay}</strong> for the following event:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${eventName}</p>
          <p style="margin: 4px 0;"><strong>Start:</strong> ${eventStartDate.toLocaleDateString()} ${eventStartDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
          <p style="margin: 4px 0;"><strong>End:</strong> ${eventEndDate.toLocaleDateString()} ${eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
          ${partnerName ? `<p style="margin: 4px 0;"><strong>${partnerRole}:</strong> ${partnerName}</p>` : ''}
        </div>
        <p>View your dashboard to see all assignments and details:</p>
        <a href="${dashboardUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Dashboard
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This is an automated email from the Mentorship Feedback Platform.
        </p>
      </div>
    `,
  });

  return info;
}
