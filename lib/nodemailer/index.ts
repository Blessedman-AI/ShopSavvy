'use server';

import { EmailContent, EmailProductInfo, NotificationType } from '@/types';
import nodemailer from 'nodemailer';

const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
};

export async function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType
) {
  const THRESHOLD_PERCENTAGE = 40;

  // Shorten the product title
  const shortenedTitle =
    product.title.length > 30
      ? `${product.title.substring(0, 30)}...`
      : product.title;

  let subject = '';
  let body = '';

  switch (type) {
    case Notification.WELCOME:
      subject = `ShopSavvy Tracking for ${shortenedTitle}`;
      body = `
        <div>
          <h2>Welcome to ShopSavvy 🚀</h2>
          <P>We're thrilled to have you with us! As a valued user, 
          you'll receive timely email notifications for the products
           you're tracking. Here's what to expect:</P>

           <br/>

          Price Drops: Get alerted when the price of your tracked product decreases, so you never miss a deal.
          <br/>
          Back in Stock: If an item you’re tracking is out of stock, we’ll notify you as soon as it’s available again.
          <br/>
          Discount Alerts: Receive updates when the discount rate reaches or drops below 40%, ensuring you get the best savings.

          <br/>

          If this landed in your spam filter, please move it to inbox so you don't miss subsequent notifications.

          <br/>

          Happy Savvy shopping!
          
        </div>
      `;
      break;

    case Notification.CHANGE_OF_STOCK:
      subject = `${shortenedTitle} is now back in stock!`;
      body = `
        <div>
          <h4>Hey, ${product.title} is now restocked! Grab yours before they run out again!</h4>
          <p>See the product <a href="${product.url}" target="_blank" rel="noopener noreferrer">here</a>.</p>
        </div>
      `;
      break;

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert for ${shortenedTitle}`;
      body = `
        <div>
          <h4>Hey, ${product.title} has reached its lowest price ever!!</h4>
          <p>Grab the product <a href="${product.url}" target="_blank" rel="noopener noreferrer">here</a> now.</p>
        </div>
      `;
      break;

    case Notification.THRESHOLD_MET:
      subject = `Discount Alert for ${shortenedTitle}`;
      body = `
        <div>
          <h4>Hey, ${product.title} is now available at a discount more than ${THRESHOLD_PERCENTAGE}%!</h4>
          <p>Grab it right away from <a href="${product.url}" target="_blank" rel="noopener noreferrer">here</a>.</p>
        </div>
      `;
      break;

    default:
      throw new Error('Invalid notification type.');
  }

  return { subject, body };
}

const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false,
  },
  auth: {
    user: 'shopsavvy-beta@outlook.com',
    pass: '9812#$Sddvj89fjmn',
  },
});

// export const sendEmail = async (
//   emailContent: EmailContent,
//   sendTo: string[]
// ) => {
//   const mailOptions = {
//     from: 'shopsavvy-beta@outlook.com',
//     to: sendTo,
//     html: emailContent.body,
//     subject: emailContent.subject,
//   };

//   transporter.sendMail(mailOptions, (error: any, info: any) => {
//     if (error)  return console.log(error);

//     console.log('Email sent: ', info);
//   });
// };
export const sendEmail = async (
  emailContent: EmailContent,
  sendTo: string[]
): Promise<boolean> => {
  const mailOptions = {
    from: 'shopsavvy-beta@outlook.com',
    to: sendTo,
    html: emailContent.body,
    subject: emailContent.subject,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info);
    return true;
  } catch (error) {
    console.log('Failed to send email:', error);
    return false;
  }
};
