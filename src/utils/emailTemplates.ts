export const emailText = (verificationLink: string) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, sans-serif;">
      <!-- Wrapper Table -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f7; padding: 40px 0;">
          <tr>
              <td align="center">
                  <!-- Main Email Container -->
                  <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

                      <!-- Header / Logo -->
                      <tr>
                          <td align="center" style="padding: 40px 0 20px 0; background-color: #ffffff;">
                              <h2 style="margin: 0; color: #333333; font-size: 24px; font-weight: 700;">Finance Tracker</h2>
                          </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                          <td style="padding: 20px 40px 40px 40px; color: #555555; font-size: 16px; line-height: 1.5;">
                              <h3 style="color: #222222; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Please verify your email address</h3>
                              <p style="margin: 0 0 20px 0;">Thanks for signing up for <strong>Finance Tracker</strong>! To start using it, please click the button below to verify your email address.</p>

                              <!-- Call To Action Button -->
                              <table border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                  <tr>
                                      <td align="center" bgcolor="#000000" style="border-radius: 6px;">
                                          <a href="${verificationLink}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; border: 1px solid #000000; display: inline-block; font-weight: bold;">Verify Email Address</a>
                                      </td>
                                  </tr>
                              </table>

                              <p style="margin: 0 0 20px 0;">If you didn't create an account with <strong>Finance Tracke</strong>, you can safely ignore this email.</p>
                          </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                          <td align="center" style="padding: 20px; background-color: #f9fafb; color: #9ca3af; font-size: 12px; line-height: 1.4;">
                              <p style="margin: 0;">(˵ •̀ ᴗ - ˵ ) ✧</p>
                          </td>
                      </tr>

                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>`;
};
