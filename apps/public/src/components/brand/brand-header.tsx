interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  logo?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    pinterest?: string;
    website?: string;
  };
  ctaButton?: {
    text: string;
    url: string;
  };
}

export function BrandHeader({ title, subtitle, logo, socialLinks, ctaButton }: BrandHeaderProps) {
  return (
    <div className="text-center mb-8 md:mb-10 space-y-6">
      {/* Logo/Brand Mark */}
      {logo ? (
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full overflow-hidden bg-white elev-2">
          <img src={logo} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center elev-2">
          <span className="text-black font-bold text-base md:text-lg">
            {title.split(".")[0]?.toUpperCase() || title.charAt(0)}
          </span>
        </div>
      )}

      {/* Brand Title */}
      <div>
        <h1 className="text-white text-lg md:text-xl font-bold tracking-wide mb-2">{title}</h1>
        {subtitle && <p className="text-gray-400 text-xs md:text-sm">{subtitle}</p>}
      </div>

      {/* Social Links */}
      {socialLinks && (
        <div className="flex justify-center space-x-5 md:space-x-6">
          {socialLinks.instagram && (
            <a
              href={socialLinks.instagram}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24" role="img">
                <title>Instagram</title>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          )}
          {socialLinks.twitter && (
            <a
              href={socialLinks.twitter}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24" role="img">
                <title>Twitter</title>
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          )}
          {socialLinks.pinterest && (
            <a
              href={socialLinks.pinterest}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Pinterest"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24" role="img">
                <title>Pinterest</title>
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.1.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* CTA Button */}
      {ctaButton && (
        <a
          href={ctaButton.url}
          className="inline-block glass text-white px-6 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-medium tracking-wide hover:bg-white/20 transition-colors duration-200 rounded-xl"
        >
          {ctaButton.text}
        </a>
      )}
    </div>
  );
}
