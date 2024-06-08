'use server';

import { revalidatePath } from 'next/cache';
import Product from '../models/product.model';
import { connectToDB } from '../mongoose';
import { getAveragePrice, getHighestPrice, getLowestPrice } from '../utils';
import { scrapeEcommerceProduct } from './scraper';
import { ObjectId } from 'mongodb';

import { User } from '@/types';
import { generateEmailBody, sendEmail } from '../nodemailer';
import { redirect } from 'next/navigation';
import { Fascinate_Inline } from 'next/font/google';
import { FilterQuery } from 'mongoose';

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {
    connectToDB();
    const scrapedProduct = await scrapeEcommerceProduct(productUrl);

    if (!scrapedProduct) return;

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice },
      ];

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );
    console.log(`newProduct is: ${newProduct}`);

    revalidatePath(`/products/${newProduct._id}`);
    return newProduct.toObject();
  } catch (error: any) {
    throw new Error(`Failed to create/update product: ${error.message}`);
  }
}

//GET PRODUCT BY ID FOR DISPLAY ON PAGE
export async function getProductById(productId: string) {
  try {
    connectToDB();

    const product = await Product.findOne({ _id: productId });

    if (!product) return null;

    return product;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts(
  sortBy?: FilterQuery<any>,
  limit: number = 6
) {
  try {
    connectToDB();

    const products = await Product.find().sort(sortBy).limit(limit);

    return products;
  } catch (error) {
    console.log(error);
  }
}
export async function getProductByIdAndIncrementViews(productId: string) {
  try {
    await connectToDB();

    // Find the product by its ID and increment the views count
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: new ObjectId(productId) },
      { $inc: { views: 1 } },
      { returnDocument: 'after' } // Ensure the updated document is returned
    );

    if (!updatedProduct.value) {
      return null;
    }
    return updatedProduct.value.views;
  } catch (error) {
    // Log any errors that occur
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    })
      .sort({ views: -1 })
      .limit(6);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}
export async function getTrendingProducts(productId: number) {
  try {
    connectToDB();

    // const trendingProducts = await Product.find({})
    //   .sort({ views: -1 })
    //   .limit(9);

    const updatedPost = await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// export async function addUserEmailToProduct(
//   productId: string,
//   userEmail: string
// ) {
//   try {
//     const product = await Product.findById(productId);

//     if (!product) return;

//     const userExists = product.users.some(
//       (user: User) => user.email === userEmail
//     );

//     if (!userExists) {
//       product.users.push({ email: userEmail });

//       await product.save();

//       const emailContent = await generateEmailBody(product, 'WELCOME');

//       await sendEmail(emailContent, [userEmail]);
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }

// export async function addUserEmailToProduct(
//   productId: string,
//   userEmail: string
// ) {
//   try {
//     const product = await Product.findById(productId);

//     if (!product) return;

//     const userExists = product.users.some(
//       (user: User) => user.email === userEmail
//     );

//     if (!userExists) {
//       product.users.push({ email: userEmail });

//       await product.save();

//       const emailContent = await generateEmailBody(product, 'WELCOME');

//       await sendEmail(emailContent, [userEmail]);
//       return { success: true };
//     } else {
//       return {
//         sucess: false,
//         message: 'You are already tracking this product!',
//       };
//     }
//   } catch (error) {
//     console.log(error);
//     return {
//       success: false,
//       message: 'An error occurred while adding the user to the product.',
//     };
//   }
// }

export async function addUserEmailToProduct(
  productId: string,
  userEmail: string
) {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return {
        productTracked: false,
        emailSent: false,
      };
    }

    const userExists = product.users.some(
      (user: User) => user.email === userEmail
    );

    if (userExists) {
      return {
        productTracked: false,
        emailsent: false,
      };
    }

    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();

      const emailContent = await generateEmailBody(product, 'WELCOME');
      const emailSent = await sendEmail(emailContent, [userEmail]);

      return {
        emailSent: true,
        productTracked: true,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: 'An error occurred while processing your request.',
      productSaved: false,
      emailSent: false,
    };
  }
}
