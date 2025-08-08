interface ContentItemProps {
  type: 'product' | 'image' | 'video';
  image: string;
  title?: string;
  price?: string;
  href?: string;
  overlay?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  className?: string;
}

export function ContentItem({ 
  type, 
  image, 
  title, 
  price, 
  href, 
  overlay, 
  className = "" 
}: ContentItemProps) {
  const content = (
    <div className={`relative aspect-square overflow-hidden bg-gray-800 group ${className}`}>
      {/* Background Image */}
      <img 
        src={image} 
        alt={title || 'Content item'} 
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      
      {/* Overlay */}
      {overlay && (
        <div className={`
          absolute z-10 text-white font-bold text-xs px-2 py-1 
          ${overlay.position === 'top-left' ? 'top-2 left-2' : ''}
          ${overlay.position === 'top-right' ? 'top-2 right-2' : ''}
          ${overlay.position === 'bottom-left' ? 'bottom-2 left-2' : ''}
          ${overlay.position === 'bottom-right' ? 'bottom-2 right-2' : ''}
          ${overlay.position === 'center' ? 'inset-0 flex items-center justify-center text-center text-lg' : ''}
        `}>
          <span className={overlay.position === 'center' ? 'bg-black bg-opacity-50 px-4 py-2 rounded' : ''}>
            {overlay.text}
          </span>
        </div>
      )}

      {/* Gradient Overlay for Text */}
      {(title || price) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          {title && (
            <h3 className="text-white text-sm font-medium leading-tight">
              {title}
            </h3>
          )}
          {price && (
            <p className="text-white/90 text-xs mt-1">
              {price}
            </p>
          )}
        </div>
      )}

      {/* Video Play Icon */}
      {type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Product Badge */}
      {type === 'product' && price && (
        <div className="absolute top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded-full font-medium">
          {price}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block transition-transform hover:scale-105">
        {content}
      </a>
    );
  }

  return content;
}