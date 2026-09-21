const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    let transporter;
    
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('[Email System] Verifying SMTP Connection...');
    await transporter.verify();
    console.log('[Email System] SMTP Connection Successful.');

    const mailOptions = {
      from: `College Event Hub <${process.env.EMAIL_USER || 'noreply@collegeeventhub.com'}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email System] Sending email to: ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email System] Email sent successfully! Message ID: %s', info.messageId);
    
    return true;
  } catch (error) {
    console.error('[Email System] Error sending email! Failure reason:');
    console.error(error.stack);
    throw new Error('Failed to send OTP. Please try again. (' + error.message + ')');
  }
};

const getOTPVerificationTemplate = (name, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-w-md: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4F46E5; text-align: center;">Verify Your Email</h2>
      <p style="font-size: 16px; color: #333;">Hello ${name},</p>
      <p style="font-size: 16px; color: #333;">Thank you for registering with College Event Hub! Please use the following OTP to verify your email address and complete your registration.</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `;
};

const getAdminRequestNotificationTemplate = (applicantData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-w-md: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #F59E0B; text-align: center;">New Admin Approval Request</h2>
      <p style="font-size: 16px; color: #333;">A new administrator has registered.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Details:</strong></p>
        <p><strong>Name:</strong> ${applicantData.name}</p>
        <p><strong>Email:</strong> ${applicantData.email}</p>
        <p><strong>Mobile Number:</strong> ${applicantData.phone}</p>
        <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="font-size: 14px; color: #666;">Please review the request from the Admin Portal.</p>
    </div>
  `;
};

const getAdminApprovalTemplate = (name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-w-md: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #10B981; text-align: center;">Admin Account Approved</h2>
      <p style="font-size: 16px; color: #333;">Congratulations!</p>
      <p style="font-size: 16px; color: #333;">Your admin account has been approved. You can now log in.</p>
    </div>
  `;
};

const getAdminRejectionTemplate = (name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-w-md: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #EF4444; text-align: center;">Admin Registration Rejected</h2>
      <p style="font-size: 16px; color: #333;">Your admin request has been rejected by the Main Administrator.</p>
    </div>
  `;
};

module.exports = { 
  sendEmail, 
  getOTPVerificationTemplate,
  getAdminRequestNotificationTemplate,
  getAdminApprovalTemplate,
  getAdminRejectionTemplate
};
