import { NextResponse } from 'next/server';

import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
  getEmailNotifType,
} from '@/lib/utils';
import { connectToDB } from '@/lib/mongoose';
import Product from '@/lib/models/product.model';
import { scrapeEcommerceProduct } from '@/lib/actions/scraper';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';

export const maxDuration = 60; // This function can run for a maximum of 300 seconds
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    connectToDB();

    const products = await Product.find({});

    if (!products) throw new Error('No product fetched');

    // ====== 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        // Scrape product
        const scrapedProduct = await scrapeEcommerceProduct(currentProduct.url);

        if (!scrapedProduct) return;

        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];

        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        // Update Products in DB
        const updatedProduct = await Product.findOneAndUpdate(
          {
            url: product.url,
          },
          product
        );

        // ====== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
        const emailNotifType = getEmailNotifType(
          scrapedProduct,
          currentProduct
        );

        if (emailNotifType && updatedProduct.users.length > 0) {
          const productInfo = {
            title: updatedProduct.title,
            url: updatedProduct.url,
          };
          // Construct emailContent
          const emailContent = await generateEmailBody(
            productInfo,
            emailNotifType
          );
          // Get array of user emails
          const userEmails = updatedProduct.users.map(
            (user: any) => user.email
          );
          // Send email notification
          await sendEmail(emailContent, userEmails);
        }

        return updatedProduct;
      })
    );

    return NextResponse.json({
      message: 'Ok',
      data: updatedProducts,
    });
  } catch (error: any) {
    throw new Error(`Failed to get products: ${error.message}`);
  }
}

// import { NextResponse } from 'next/server';

// import {
//   getLowestPrice,
//   getHighestPrice,
//   getAveragePrice,
//   getEmailNotifType,
// } from '@/lib/utils';
// import { connectToDB } from '@/lib/mongoose';
// import Product from '@/lib/models/product.model';
// import { scrapeEcommerceProduct } from '@/lib/actions/scraper';
// import { generateEmailBody, sendEmail } from '@/lib/nodemailer';

// export const maxDuration = 60; // This function can run for a maximum of 300 seconds
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

// export async function GET(request: Request) {
//   try {
//     connectToDB();

//     const products = await Product.find({});

//     if (!products) throw new Error('No product fetched');

//     // ====== 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
//     const updatedProducts = await Promise.all(
//       products.map(async (currentProduct) => {
//         // Scrape product
//         const scrapedProduct = await scrapeEcommerceProduct(currentProduct.url);

//         if (!scrapedProduct) {
//           console.error(
//             `Failed to scrape product for URL: ${currentProduct.url}`
//           );
//           return;
//         }

//         if (!currentProduct.priceHistory) {
//           console.error(
//             `Product price history is missing for: ${currentProduct.url}`
//           );
//           return;
//         }

//         const updatedPriceHistory = [
//           ...currentProduct.priceHistory,
//           {
//             price: scrapedProduct.currentPrice,
//           },
//         ];

//         const product = {
//           ...scrapedProduct,
//           priceHistory: updatedPriceHistory,
//           lowestPrice: getLowestPrice(updatedPriceHistory),
//           highestPrice: getHighestPrice(updatedPriceHistory),
//           averagePrice: getAveragePrice(updatedPriceHistory),
//         };

//         // Update Products in DB
//         const updatedProduct = await Product.findOneAndUpdate(
//           {
//             url: product.url,
//           },
//           product,
//           { new: true } // Ensure the updated document is returned
//         );

//         if (!updatedProduct) {
//           console.error(`Failed to update product for URL: ${product.url}`);
//           return;
//         }

//         // ====== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
//         const emailNotifType = getEmailNotifType(
//           scrapedProduct,
//           currentProduct
//         );

//         if (emailNotifType && updatedProduct.users.length > 0) {
//           const productInfo = {
//             title: updatedProduct.title,
//             url: updatedProduct.url,
//           };
//           // Construct emailContent
//           const emailContent = await generateEmailBody(
//             productInfo,
//             emailNotifType
//           );
//           // Get array of user emails
//           const userEmails = updatedProduct.users.map(
//             (user: any) => user.email
//           );
//           // Send email notification
//           await sendEmail(emailContent, userEmails);
//         }

//         return updatedProduct;
//       })
//     );

//     return NextResponse.json({
//       message: 'Ok',
//       data: updatedProducts,
//     });
//   } catch (error: any) {
//     console.error(`Error: ${error.message}`);
//     throw new Error(`Failed to get all products: ${error.message}`);
//   }
// }
