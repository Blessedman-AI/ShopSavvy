'use client';

import { scrapeAndStoreProduct } from '@/lib/actions';
import { useRouter } from 'next/navigation';
// import { scrapeAndStoreProduct } from '@/lib/actions';
import { FormEvent, useState } from 'react';

const isValidAmazonProductURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    //Check if hostname contains amazon.com or other variation
    if (
      hostname.includes('jumia.com.ng') ||
      hostname.includes('jumia.') ||
      hostname.includes('amazon.com') ||
      hostname.includes('amazon.') ||
      hostname.endsWith('amazon') ||
      hostname.endsWith('jumia')
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink = isValidAmazonProductURL(searchPrompt);

    // alert(isValidLink ? 'valid link' : 'invalid link');

    if (!isValidLink) return alert('Please provide a valid Amazon link');

    try {
      setIsLoading(true);

      // Scrape the product page
      const product = await scrapeAndStoreProduct(searchPrompt);
      console.log('Scraped product:', product);

      if (product && product._id) {
        console.log('Navigating to product page:', `/products/${product._id}`);
        // alert('Navigating now');
        router.push(`/products/${product._id}`);
      } else {
        console.log('Product not found or invalid');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      setSearchPrompt('');
    }
  };

  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder="Enter product link"
        className="searchbar-input"
      />

      <button
        type="submit"
        className="searchbar-btn"
        disabled={searchPrompt === ''}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default Searchbar;
