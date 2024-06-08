import HeroCarousel from '@/components/HeroCarousel';

import Searchbar from '@/components/Searchbar';
import Image from 'next/image';
import {
  getAllProducts,
  getProductByIdAndIncrementViews,
  getTrendingProducts,
} from '@/lib/actions';
import ProductCard from '@/components/ProductCard';
// import ProductCard from '@/components/ProductCard';

type Props = {
  params: { id: string };
};
const Home = async () => {
  const latestProducts = await getAllProducts({ createdAt: -1 }, 6);

  return (
    <>
      <section className="px-6 md:px-20 py-24">
        <div className="lg:flex  gap-16">
          <div className="flex flex-col justify-center">
            <p className="small-text">
              Track Prices & Catch the Best Deals Here
              <Image
                src="/assets/icons/arrow-right.svg"
                alt="arrow-right"
                width={16}
                height={16}
              />
            </p>

            <h1 className="head-text">
              Smart Shopping Starts with
              <span className="text-primary"> ShopSavvy</span>
            </h1>

            <p className="mt-6">
              Powerful, self-serve product and growth analytics to help you
              convert, engage, and retain more.
            </p>

            <div className="mt-16 ">
              {' '}
              <Searchbar />
            </div>
          </div>

          <div className="mt-12 lg-mt-0"> </div>
          <HeroCarousel />
        </div>
      </section>

      {latestProducts && (
        <section className="trending-section">
          <h2 className="section-text">Most recent searches</h2>

          <div className="flex flex-wrap  gap-x-8 gap-y-16">
            {latestProducts?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
