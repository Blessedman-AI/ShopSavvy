'use client';

import Image from 'next/image';
import Link from 'next/link';
import Searchbar from './Searchbar';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navIcons = [
  { src: '/assets/icons/search.svg', alt: 'search' },
  { src: '/assets/icons/black-heart.svg', alt: 'heart' },
  { src: '/assets/icons/user.svg', alt: 'user' },
];

const Navbar = () => {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  // State to track window size
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    // Function to check screen size
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    // Initial check
    checkScreenSize();

    // Add event listener to check screen size on window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return (
    <header className="w-full bg-neutral-black">
      <nav className="nav max-w-10xl">
        <Link href="/" className={`flex`}>
          <Image
            src="/assets/icons/logo2.png"
            width={27}
            height={27}
            alt="logo"
            className={`${isHomepage ? 'flex' : ''} ${
              !isHomepage && isSmallScreen ? 'hidden' : ''
            }`}
          />

          <p className="nav-logo md:text-[21px]">
            Shop<span className="text-primary">Savvy</span>
          </p>
        </Link>

        <div
          className={`${isHomepage && isSmallScreen ? 'hidden' : ''} ${
            !isHomepage && !isSmallScreen ? 'flex' : ''
          } ${
            isSmallScreen && !isHomepage
              ? 'flex items-center justify center'
              : ''
          }`}
        >
          {/* {navIcons.map((icon) => (
            <Image
              key={icon.alt}
              src={icon.src}
              alt={icon.alt}
              width={28}
              height={28}
              className="object-contain"
            />
          ))} */}
          <Searchbar />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
