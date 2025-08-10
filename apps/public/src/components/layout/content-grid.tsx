interface ContentGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentGrid({ children, className = "" }: ContentGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 w-full max-w-md mx-auto ${className}`}>{children}</div>
  );
}

interface GridItemProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function GridItem({ children, href, onClick, className = "" }: GridItemProps) {
  const baseClasses =
    "aspect-square overflow-hidden rounded-lg transition-transform hover:scale-105";

  if (href) {
    return (
      <a href={href} className={`${baseClasses} block ${className}`}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} ${className} cursor-pointer`}>
        {children}
      </button>
    );
  }

  return <div className={`${baseClasses} ${className}`}>{children}</div>;
}
