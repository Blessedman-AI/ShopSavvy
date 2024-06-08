import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  return (
    <Link
      href={`/products/${product._id}`}
      className="product-card p-4 border-2 border-slate-100"
    >
      <div className="product-card_img-container">
        <Image
          src={product.image}
          alt={product.title}
          width={200}
          height={200}
          className="product-card_img"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="product-title">{product.title}</h3>

        <div className="flex justify-between">
          <p
            className="text-black flex justify-center items-center 
          gap-2 opacity-80 text-sm capitalize"
          >
            <span className="bg-primary  rounded-[8px] px-2 py-[2px]">
              {' '}
              {product.category}
            </span>
            <span className="bg-yellow  rounded-[8px] px-2 py-[2px]">
              {' '}
              {product.views} Views
            </span>
          </p>

          <p className="text-black text-lg font-semibold">
            <span>{product?.currency}</span>
            <span>{product?.currentPrice.toLocaleString()}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
