const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure === "true",

  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
});

const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: `"ScanSpend" <${env.smtp.from}>`,
    to: email,
    subject: "Reset your ScanSpend password",

    text: `
Hello ${name},

We received a request to reset your ScanSpend password.

Use the link below to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
ScanSpend Team
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your ScanSpend password</h2>

        <p>Hello ${name},</p>

        <p>
          We received a request to reset your ScanSpend password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in <strong>15 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <p>
          Regards,<br />
          ScanSpend Team
        </p>
      </div>
    `,
  });
};

const sendEmailVerificationEmail = async ({
  email,
  name,
  verificationToken,
}) => {
  const verificationUrl = `${env.clientUrl}/verify-email/${verificationToken}`;

  await transporter.sendMail({
    from: `"ScanSpend" <${env.smtp.from}>`,
    to: email,
    subject: "Verify your ScanSpend email",

    text: `
Hello ${name},

Welcome to ScanSpend.

Please verify your email address by opening the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you did not create a ScanSpend account, you can safely ignore this email.

Regards,
ScanSpend Team
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your ScanSpend email</h2>

        <p>Hello ${name},</p>

        <p>
          Welcome to <strong>ScanSpend</strong>.
        </p>

        <p>
          Please verify your email address by clicking the button below:
        </p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          This verification link will expire in
          <strong>24 hours</strong>.
        </p>

        <p>
          If you did not create a ScanSpend account,
          you can safely ignore this email.
        </p>

        <p>
          Regards,<br />
          ScanSpend Team
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
};
