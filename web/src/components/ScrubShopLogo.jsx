import React from 'react';

const ScrubShopLogo = ({ size = 'medium', className = '' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { 
          welcome: 'text-xs', 
          main: 'text-lg', 
          tagline: 'text-xs',
          container: 'py-1'
        };
      case 'large':
        return { 
          welcome: 'text-lg', 
          main: 'text-3xl', 
          tagline: 'text-base',
          container: 'py-3'
        };
      default: // medium
        return { 
          welcome: 'text-sm', 
          main: 'text-2xl', 
          tagline: 'text-sm',
          container: 'py-2'
        };
    }
  };

  const sizes = getSizeClasses();

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* WELCOME TO */}
      <div className={`font-bold text-black mb-1 ${sizes.welcome}`}>
        WELCOME TO
      </div>
      
      {/* The Scrub Shop Logo */}
      <div className="flex items-center mb-1">
        <span className={`italic text-green-500 mr-1 ${sizes.welcome}`}>The</span>
        <div className="flex items-center">
          <span className={`italic font-bold text-white ${sizes.main}`} style={{
            textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
          }}>
            Scrub
          </span>
          <span className={`italic font-bold text-green-500 ${sizes.main}`} style={{
            textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
          }}>
            Shop
          </span>
        </div>
      </div>
      
      {/* FOOTWEAR & APPAREL Tagline */}
      <div className={`bg-black rounded-lg px-2 ${sizes.container}`}>
        <span className={`font-bold text-white ${sizes.tagline}`}>
          FOOTWEAR & APPAREL
        </span>
      </div>
    </div>
  );
};

export default ScrubShopLogo;
