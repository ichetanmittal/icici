import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityName, geography, pocName, pocEmail, pocPhone, creditLimit, bankAccountNumber, swiftCode } = body;

    // Validate required fields
    if (!entityName || !geography || !pocName || !pocEmail || !pocPhone || !creditLimit || !bankAccountNumber || !swiftCode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString('hex');

    // Get current user from authorization header (you might need to implement this)
    // For now, we'll store it without invited_by

    // Store invitation in database
    const { data: invitation, error: dbError } = await supabase
      .from('invitations')
      .insert({
        token,
        entity_name: entityName,
        geography,
        poc_name: pocName,
        poc_email: pocEmail,
        poc_phone: pocPhone,
        credit_limit: parseFloat(creditLimit),
        bank_account_number: bankAccountNumber,
        swift_code: swiftCode,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email template
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: pocEmail,
      subject: 'Invitation to Join ICICI Trade Finance Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trade Finance Platform Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Lexend', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; background-color: #ea580c; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        xaults<span style="color: #fdba74;">*</span>
                      </h1>
                      <p style="margin: 8px 0 0; color: #fed7aa; font-size: 14px;">Trade Finance Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                        You've Been Invited!
                      </h2>

                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Dear ${pocName},
                      </p>

                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        You have been invited to join the <strong>ICICI Trade Finance Platform</strong> as an Importer.
                        We're excited to have <strong>${entityName}</strong> join our network.
                      </p>

                      <!-- Details Box -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #f3f4f6; border-radius: 8px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px; color: #111827; font-size: 16px; font-weight: 600;">
                              Invitation Details
                            </h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Entity Name:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${entityName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Geography:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${geography}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Credit Limit:</td>
                                <td style="padding: 8px 0; color: #16a34a; font-size: 14px; font-weight: 600; text-align: right;">$${parseFloat(creditLimit).toLocaleString()}</td>
                              </tr>
                            </table>

                            <h4 style="margin: 20px 0 10px; color: #111827; font-size: 14px; font-weight: 600;">
                              Banking Information
                            </h4>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Account Number:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bankAccountNumber}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">SWIFT Code:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${swiftCode}</td>
                              </tr>
                            </table>

                            <h4 style="margin: 20px 0 10px; color: #111827; font-size: 14px; font-weight: 600;">
                              Point of Contact
                            </h4>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${pocName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${pocEmail}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone:</td>
                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${pocPhone}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invitation=${token}"
                               style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Complete Registration
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Click the button above to complete your registration and get started with the platform.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                        If you have any questions, please contact our support team.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} ICICI Trade Finance Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Dear ${pocName},

        You have been invited to join the ICICI Trade Finance Platform as an Importer.

        Invitation Details:
        - Entity Name: ${entityName}
        - Geography: ${geography}
        - Credit Limit: $${parseFloat(creditLimit).toLocaleString()}

        Banking Information:
        - Account Number: ${bankAccountNumber}
        - SWIFT Code: ${swiftCode}

        Point of Contact:
        - Name: ${pocName}
        - Email: ${pocEmail}
        - Phone: ${pocPhone}

        Please visit ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invitation=${token} to complete your registration.

        Best regards,
        ICICI Trade Finance Platform
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Invitation sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
