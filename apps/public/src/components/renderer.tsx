import type { CardDetails, Category, SiteConfig } from "@minimall/core/client";
import { cn } from "@minimall/ui";
import { ImageCard } from "./cards/image-card";
import { ProductCard } from "./cards/product-card";
import { VideoCard } from "./cards/video-card";
import { TabNavigation } from "./navigation/tab-navigation";
import { ThemeProvider } from "./theme/theme-provider";

interface RendererProps {
  config: SiteConfig;
  className?: string | undefined;
}

export function Renderer({ config, className }: RendererProps) {
  return (
    <ThemeProvider theme={config.settings.theme}>
      <div className={cn("min-h-screen bg-background", className)}>
        <TabNavigation categories={config.categories} />
        <main className="container mx-auto px-4 py-8">
          <CategoryRenderer categories={config.categories} />
        </main>
      </div>
    </ThemeProvider>
  );
}

interface CategoryRendererProps {
  categories: Category[];
  className?: string;
}

function CategoryRenderer({ categories, className }: CategoryRendererProps) {
  return (
    <div className={cn("space-y-12", className)}>
      {categories
        .filter((category) => category.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
    </div>
  );
}

interface CategorySectionProps {
  category: Category;
  className?: string;
}

function CategorySection({ category, className }: CategorySectionProps) {
  const [cardType, cardDetails] = category.card;
  const [_categoryType, categoryTypeDetails] = category.categoryType;

  // Determine grid layout based on category type and display settings
  const getGridClass = () => {
    const itemsPerRow = categoryTypeDetails.itemsPerRow || 3;
    const displayType = categoryTypeDetails.displayType || "grid";

    if (displayType === "slider") {
      return "flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory";
    }

    // Grid layout
    switch (itemsPerRow) {
      case 1:
        return "grid grid-cols-1 gap-4";
      case 2:
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
      case 3:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
      case 4:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
      case 5:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3";
      case 6:
        return "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
    }
  };

  return (
    <section id={category.id} className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{category.title}</h2>
        {cardDetails.description && (
          <p className="text-muted-foreground max-w-2xl mx-auto">{cardDetails.description}</p>
        )}
      </div>

      {/* Content Grid/Slider */}
      <div className={getGridClass()}>
        {/* Render child categories */}
        {category.children?.map((child) => (
          <CardRenderer
            key={child.id}
            category={child}
            displayType={categoryTypeDetails.displayType || "grid"}
          />
        ))}

        {/* Render products if this is a product category */}
        {categoryTypeDetails.products?.map((product) => (
          <ProductCard
            key={product.id}
            productId={product.productId}
            variantId={product.variantId ?? null}
            displayType={categoryTypeDetails.displayType || "grid"}
          />
        ))}

        {/* If no children or products, show placeholder cards based on card type */}
        {(!category.children || category.children.length === 0) &&
          (!categoryTypeDetails.products || categoryTypeDetails.products.length === 0) && (
            <PlaceholderCards
              cardType={cardType}
              cardDetails={cardDetails}
              count={categoryTypeDetails.itemsPerRow || 3}
              displayType={categoryTypeDetails.displayType || "grid"}
            />
          )}
      </div>
    </section>
  );
}

interface CardRendererProps {
  category: Category;
  displayType?: string;
  className?: string;
}

function CardRenderer({ category, displayType, className }: CardRendererProps) {
  const [cardType, cardDetails] = category.card;

  const cardClass = cn(displayType === "slider" && "flex-none snap-start", className);

  switch (cardType) {
    case "image":
      return (
        <ImageCard
          title={category.title}
          imageUrl={cardDetails.imageUrl || ""}
          {...(typeof cardDetails.link === "string" &&
            cardDetails.link && { link: { url: cardDetails.link } })}
          shape={cardDetails.shape?.[0] || "square"}
          className={cardClass}
        />
      );

    case "video":
      return (
        <VideoCard
          title={category.title}
          videoUrl={cardDetails.videoUrl || ""}
          imageUrl={cardDetails.imageUrl || ""} // Thumbnail
          {...(typeof cardDetails.link === "string" &&
            cardDetails.link && { link: { url: cardDetails.link } })}
          className={cardClass}
        />
      );

    case "product": {
      // For product cards, we need to extract product info from the category
      const product = cardDetails.products?.[0];
      if (!product) {
        return (
          <div
            className={cn(
              "aspect-square bg-muted rounded-lg flex items-center justify-center",
              cardClass
            )}
          >
            <p className="text-muted-foreground">No product configured</p>
          </div>
        );
      }

      return (
        <ProductCard
          productId={product.productId}
          variantId={product.variantId ?? null}
          className={cardClass}
        />
      );
    }
    default:
      return (
        <ImageCard
          title={category.title}
          imageUrl={cardDetails.imageUrl || ""}
          {...(typeof cardDetails.link === "string" &&
            cardDetails.link && { link: { url: cardDetails.link } })}
          shape={cardDetails.shape?.[0] || "square"}
          className={cardClass}
        />
      );
  }
}

interface PlaceholderCardsProps {
  cardType: string;
  cardDetails: CardDetails;
  count: number;
  displayType?: string;
  className?: string;
}

function PlaceholderCards({
  cardType,
  cardDetails,
  count,
  displayType,
  className,
}: PlaceholderCardsProps) {
  const cardClass = cn(displayType === "slider" && "flex-none snap-start", className);

  const placeholders = Array.from({ length: count }, (_, i) => (
    <div
      key={`placeholder-${i}`}
      className={cn(
        "aspect-square bg-muted rounded-lg flex items-center justify-center",
        cardClass
      )}
    >
      <div className="text-center space-y-2">
        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">
          {cardType === "product" ? "Product" : "Content"} {i + 1}
        </p>
      </div>
    </div>
  ));

  return <>{placeholders}</>;
}
