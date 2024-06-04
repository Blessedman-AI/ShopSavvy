import { PriceHistoryItem, Product } from '@/types';

const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
};

const THRESHOLD_PERCENTAGE = 40;

// Extracts and returns the price from a list of possible elements.
export function extractPrice(...elements: any) {
  for (const element of elements) {
    const priceText = element.text().trim();

    if (priceText) {
      const cleanedPriceText = priceText.replace(/[^\d.]/g, '');

      // Split the cleaned text by any non-digit characters (effectively handling concatenated prices)
      const parts = cleanedPriceText.split(/[^\d]/);

      // Take the first part as the valid price
      const firstValidPart = parts[0];

      // Convert the first valid part to a number
      // const priceNumber = parseFloat(firstValidPart);

      return firstValidPart;
      // return priceNumber;

      //   // Check if the conversion to number was successful
      //   if (!isNaN(priceNumber)) {
      //     // Format the number with one decimal point and return
      //     const formattedPrice = new Intl.NumberFormat('en-US', {
      //       minimumFractionDigits: 1,
      //       maximumFractionDigits: 1,
      //     }).format(priceNumber);

      //     return formattedPrice;
      //   }

      //   let firstPrice;

      //   if (cleanPrice) {
      //     firstPrice = cleanPrice.match(/\d+\.\d{2}/)?.[0];
      //   }

      //   return firstPrice || cleanPrice;
    }
  }

  return 0;
}

// // Extracts and returns the currency symbol from an element.

export function extractCurrency(element1: any, element2: any) {
  let currencyText = '';
  const elements: any[] = [element1, element2]; // Collect elements into an array
  elements.forEach((element) => {
    const textContent = element.text().trim();
    if (textContent) {
      currencyText = textContent.slice(0, 1);
      return; // Exit the loop if a currency symbol is found
    }
  });
  return currencyText;
}

///////////////////////////////////////

// // Extracts description from two possible elements from amazon
// export function extractDescription($: any) {
//   // these are possible elements holding description of the product
//   const selectors = [
//     '.a-unordered-list .a-list-item',
//     '.a-expander-content p',
//     // Add more selectors here if needed
//   ];

//   for (const selector of selectors) {
//     const elements = $(selector);
//     if (elements.length > 0) {
//       const textContent = elements
//         .map((_: any, element: any) => $(element).text().trim())
//         .get()
//         .join('\n');
//       return textContent;
//     }
//   }

//   // If no matching elements were found, return an empty string
//   return '';
// }

//GET HIGHEST PRICE
export function getHighestPrice(priceList: PriceHistoryItem[]) {
  let highestPrice = priceList[0];

  for (let i = 0; i < priceList.length; i++) {
    if (priceList[i].price > highestPrice.price) {
      highestPrice = priceList[i];
    }
  }

  return highestPrice.price;
}

//GET LOWEST PRICE
export function getLowestPrice(priceList: PriceHistoryItem[]) {
  let lowestPrice = priceList[0];

  for (let i = 0; i < priceList.length; i++) {
    if (priceList[i].price < lowestPrice.price) {
      lowestPrice = priceList[i];
    }
  }

  return lowestPrice.price;
}

//GET AVERAGE PRICE
export function getAveragePrice(priceList: PriceHistoryItem[]) {
  const sumOfPrices = priceList.reduce((acc, curr) => acc + curr.price, 0);
  const averagePrice = sumOfPrices / priceList.length || 0;

  return averagePrice;
}

//GET EMAIL NOTIF TYPE
export const getEmailNotifType = (
  scrapedProduct: Product,
  currentProduct: Product
) => {
  const lowestPrice = getLowestPrice(currentProduct.priceHistory);

  if (scrapedProduct.currentPrice < lowestPrice) {
    return Notification.LOWEST_PRICE as keyof typeof Notification;
  }
  if (!scrapedProduct.isOutOfStock && currentProduct.isOutOfStock) {
    return Notification.CHANGE_OF_STOCK as keyof typeof Notification;
  }
  if (scrapedProduct.discountRate >= THRESHOLD_PERCENTAGE) {
    return Notification.THRESHOLD_MET as keyof typeof Notification;
  }

  return null;
};

//FORMAT NUMBER
export const formatNumber = (num: number = 0) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
