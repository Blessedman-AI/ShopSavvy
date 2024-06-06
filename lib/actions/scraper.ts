'use server';

import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  extractCurrency,
  extractPrice,
  formatNumber,
  getHighestPrice,
  getWebsiteNameFromUrl,
} from '../utils';
// import { extractCurrency, extractDescription, extractPrice } from '../utils';

let $;
export async function scrapeEcommerceProduct(url: string) {
  if (!url) return;

  const username = String(process.env.OXYLABS_USERNAME);
  const password = String(process.env.OXYLABS_PASSWORD);
  const session_id = (1000000 * Math.random()) | 0;

  const proxyConfig = {
    host: 'pr.oxylabs.io',
    port: 7777,
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
  };

  try {
    //fectch product page
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    //EXRACT STORE NAME
    const websiteName = getWebsiteNameFromUrl(url);

    // EXTRACT PRODUCT TITLE
    const title = $('#productTitle, .-fs20.-pts.-pbxs').text().trim();

    // Select and extract review text
    const reviewText = $('.-plxs._more, #acrCustomerReviewText')
      .text()
      .trim()
      .match(/[\d,]+/);

    let reviewsCount = 0;

    if (reviewText && reviewText[0]) {
      // Remove commas from the matched string and convert it to a number
      reviewsCount = Number(reviewText[0].replace(/,/g, ''));
    }

    //EXTRACT RATING STARS
    const ratingElements = $('.stars._m._al, span.a-size-base.a-color-base')
      .text()
      .trim()
      .match(/(\d+(\.\d+)?)/);

    let stars;
    if (ratingElements) {
      stars = parseFloat(ratingElements[0]);
    }

    console.log('Rating:', stars);

    // EXTRACT CURRENT PRICE
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base'),
      $('.a-price.a-text-price'),
      $('.-b.-ubpt.-tal.-fs24.-prxs')
    );

    //EXTRACT ORIGINAL PRICE
    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price'),
      $('span.-tal.-gy5.-lthr.-fs16.-pvxs.-ubpt')
    );

    // console.log(`The original price is: ${originalPrice}`);

    // Declare the outOfStock variable and initialize it to undefined
    let outOfStock;

    // Check if either element is found before proceeding with the comparison
    const availabilityElement = $('#availability span');
    const outOfStockButtonElement = $('.btn._md._dis');

    if (availabilityElement.length > 0 || outOfStockButtonElement.length > 0) {
      let availabilityText = '';
      let outOfStockButtonText = '';

      if (availabilityElement.length > 0) {
        availabilityText = availabilityElement.text().trim().toLowerCase();
      }

      if (outOfStockButtonElement.length > 0) {
        outOfStockButtonText = outOfStockButtonElement
          .text()
          .trim()
          .toLowerCase();
      }

      // Compare the text content against 'currently unavailable' and 'out of stock'
      if (
        availabilityText === 'currently unavailable' ||
        outOfStockButtonText === 'out of stock'
      ) {
        outOfStock = true;
      } else {
        outOfStock = false;
      }
    } else {
      // Handle the case where neither element is found
      outOfStock = false; // Assuming default to false if elements are not found
    }

    // Use the outOfStock variable outside the if block

    if (outOfStock === true) {
      console.log('The item is out of stock.');
    } else if (outOfStock === false) {
      console.log('The item is in stock.');
    } else {
      console.log('Elements not found.');
    }

    //OUT OF STOCK IMPLEMENTATION FROM TUTORIAL
    // const outOfStock =
    //   $('#availability span').text().trim().toLowerCase() ===
    //     'currently unavailable' ||
    //   $('.btn._md._dis').text().trim().toLowerCase() === 'out of stock';

    const images =
      $('#imgBlkFront').attr('data-a-dynamic-image') ||
      $('#landingImage').attr('data-a-dynamic-image') ||
      $('img.-fw.-fh').attr('data-src') ||
      '{}';

    // Try to parse the images as JSON
    let imageUrl;
    try {
      const parsedImages = JSON.parse(images);
      // Check if parsedImages is an object (multiple images scenario)
      if (typeof parsedImages === 'object' && !Array.isArray(parsedImages)) {
        imageUrl = Object.keys(parsedImages)[0];
      } else {
        // If parsedImages is not an object, handle as a single URL
        imageUrl = images;
      }
    } catch (e) {
      // If parsing fails, assume it's a single image URL
      imageUrl = images;
    }

    //PARSED IMAGES FROM TUTORIAL
    // const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency(
      $('.a-price-symbol'),
      $('.-b.-ubpt.-tal.-fs24')
    );

    //EXTRACT DISCOUNT RATE
    // Select elements that potentially contain the desired text
    const elements = $(
      '.a-size-large, .a-color-price, .savingPriceOverride, .aok-align-center, .reinventPriceSavingsPercentageMargin, .savingsPercentage, ._dyn'
    );

    let discountRate; // Declare a variable outside the if block

    // Filter out elements based on their text content
    const element = elements
      .filter(function () {
        // Check if the text content contains a percentage sign
        return $(this).text().includes('%');
      })
      .first(); // Get the first matched element

    // Check if the element exists
    if (element.length === 0) {
      console.log('Element not found');
    } else {
      // Extract the text content
      const originalText = element.text().trim();

      // Extract the discount rate from the text containing the percentage sign
      const discountRateMatch = originalText.match(/\d+(?=%)/);

      // Check if a match is found
      if (discountRateMatch) {
        // Extracted discount rate
        discountRate = discountRateMatch[0];
        // console.log('Discount Rate:', discountRate);
      } else {
        console.log('Discount rate not found');
      }
    }

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '$',
      image: imageUrl,
      title,
      currentPrice: currentPrice || originalPrice,
      originalPrice: originalPrice || currentPrice,
      priceHistory: [],
      discountRate: Number(discountRate) || 0,
      category: websiteName,
      reviewsCount: reviewsCount,
      stars: stars || 0,
      isOutOfStock: outOfStock,
      lowestPrice: currentPrice || originalPrice,
      highestPrice: originalPrice || currentPrice,
      averagePrice: currentPrice || originalPrice,
    };

    return data;
  } catch (error: any) {
    // throw new error(`Failed to scrape product: ${error.message}`);
    // throw new error(`Failed to scrape product: ${error.message}`);
  }
}
