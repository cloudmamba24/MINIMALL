/**
 * Shopify Storefront API Service
 *
 * Handles all customer-facing operations: product fetching, cart management, checkout.
 * Uses GraphQL for efficient data fetching with proper error handling and caching.
 */

interface ShopifyStorefrontConfig {
  domain: string;
  accessToken: string;
}

interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

export class ShopifyStorefrontService {
  private domain: string;
  private accessToken: string;
  private endpoint: string;

  constructor(config: ShopifyStorefrontConfig) {
    this.domain = config.domain;
    this.accessToken = config.accessToken;
    this.endpoint = `https://${this.domain}/api/2024-10/graphql.json`;
  }

  /**
   * Execute GraphQL query with error handling and retries
   */
  private async query<T = any>(
    query: string,
    variables?: Record<string, unknown>,
    retries = 3
  ): Promise<T> {
    const requestBody = {
      query: query.trim(),
      ...(variables && { variables }),
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": this.accessToken,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: GraphQLResponse<T> = await response.json();

        if (result.errors?.length) {
          throw new Error(`GraphQL Error: ${result.errors.map((e) => e.message).join(", ")}`);
        }

        if (!result.data) {
          throw new Error("No data returned from GraphQL query");
        }

        return result.data;
      } catch (error) {
        console.error(`Shopify API attempt ${attempt}/${retries} failed:`, error);

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }

    throw new Error("All retry attempts failed");
  }

  /**
   * Get products by IDs
   */
  async getProducts(productIds: string[], first = 20): Promise<unknown[]> {
    const query = `
      query getProducts($ids: [ID!]!, $first: Int!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            handle
            title
            description
            vendor
            productType
            tags
            availableForSale
            createdAt
            updatedAt
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 10) {
              nodes {
                id
                url
                altText
                width
                height
              }
            }
            variants(first: $first) {
              nodes {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
                image {
                  id
                  url
                  altText
                  width
                  height
                }
                sku
                barcode
                weight
                weightUnit
                requiresShipping
              }
            }
          }
        }
      }
    `;

    const variables = {
      ids: productIds.map((id) => `gid://shopify/Product/${id}`),
      first,
    };

    const result = await this.query(query, variables);
    return result.nodes.filter(Boolean); // Filter out null nodes
  }

  /**
   * Get single product by handle or ID
   */
  async getProduct(identifier: string, isId = false): Promise<unknown> {
    const query = isId
      ? `
      query getProductById($id: ID!) {
        product(id: $id) {
          id
          handle
          title
          description
          vendor
          productType
          tags
          availableForSale
          createdAt
          updatedAt
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            nodes {
              id
              url
              altText
              width
              height
            }
          }
          variants(first: 50) {
            nodes {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                id
                url
                altText
                width
                height
              }
              sku
              barcode
              weight
              weightUnit
              requiresShipping
            }
          }
        }
      }
    `
      : `
      query getProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          handle
          title
          description
          vendor
          productType
          tags
          availableForSale
          createdAt
          updatedAt
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            nodes {
              id
              url
              altText
              width
              height
            }
          }
          variants(first: 50) {
            nodes {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                id
                url
                altText
                width
                height
              }
              sku
              barcode
              weight
              weightUnit
              requiresShipping
            }
          }
        }
      }
    `;

    const variables = isId ? { id: `gid://shopify/Product/${identifier}` } : { handle: identifier };

    const result = await this.query(query, variables);
    return isId ? result.product : result.productByHandle;
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    first = 20,
    after?: string
  ): Promise<{ products: unknown[]; hasNextPage: boolean; endCursor?: string }> {
    const searchQuery = `
      query searchProducts($query: String!, $first: Int!, $after: String) {
        search(query: $query, first: $first, after: $after, types: [PRODUCT]) {
          nodes {
            ... on Product {
              id
              handle
              title
              vendor
              productType
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 3) {
                nodes {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = { query, first, ...(after && { after }) };
    const result = await this.query(searchQuery, variables);

    return {
      products: result.search.nodes,
      hasNextPage: result.search.pageInfo.hasNextPage,
      endCursor: result.search.pageInfo.endCursor,
    };
  }

  /**
   * Get products from a collection
   */
  async getCollectionProducts(
    handle: string,
    first = 20,
    after?: string
  ): Promise<{ products: unknown[]; hasNextPage: boolean; endCursor?: string }> {
    const query = `
      query getCollectionProducts($handle: String!, $first: Int!, $after: String) {
        collectionByHandle(handle: $handle) {
          id
          title
          products(first: $first, after: $after) {
            nodes {
              id
              handle
              title
              vendor
              productType
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 3) {
                nodes {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const variables = { handle, first, ...(after && { after }) };
    const result = await this.query(query, variables);

    const collection = result.collectionByHandle;
    if (!collection) {
      throw new Error(`Collection with handle "${handle}" not found`);
    }

    return {
      products: collection.products.nodes,
      hasNextPage: collection.products.pageInfo.hasNextPage,
      endCursor: collection.products.pageInfo.endCursor,
    };
  }

  /**
   * Create a cart
   */
  async createCart(lines?: Array<{ merchandiseId: string; quantity: number }>): Promise<unknown> {
    const query = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            createdAt
            updatedAt
            checkoutUrl
            totalQuantity
            estimatedCost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
              totalDutyAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              nodes {
                id
                quantity
                estimatedCost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      id
                      title
                      handle
                    }
                    image {
                      id
                      url
                      altText
                      width
                      height
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input: { lines?: Array<{ merchandiseId: string; quantity: number }> } = {};
    if (lines?.length) {
      input.lines = lines.map((line) => ({
        merchandiseId: `gid://shopify/ProductVariant/${line.merchandiseId}`,
        quantity: line.quantity,
      }));
    }

    const result = await this.query(query, { input });

    if (result.cartCreate.userErrors?.length) {
      throw new Error(
        `Cart creation failed: ${result.cartCreate.userErrors.map((e: { message: string }) => e.message).join(", ")}`
      );
    }

    return result.cartCreate.cart;
  }

  /**
   * Add items to cart
   */
  async addToCart(
    cartId: string,
    lines: Array<{ merchandiseId: string; quantity: number }>
  ): Promise<unknown> {
    const query = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            totalQuantity
            estimatedCost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              nodes {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      cartId,
      lines: lines.map((line) => ({
        merchandiseId: `gid://shopify/ProductVariant/${line.merchandiseId}`,
        quantity: line.quantity,
      })),
    };

    const result = await this.query(query, variables);

    if (result.cartLinesAdd.userErrors?.length) {
      throw new Error(
        `Add to cart failed: ${result.cartLinesAdd.userErrors.map((e: { message: string }) => e.message).join(", ")}`
      );
    }

    return result.cartLinesAdd.cart;
  }

  /**
   * Update cart line quantities
   */
  async updateCart(
    cartId: string,
    lines: Array<{ id: string; quantity: number }>
  ): Promise<unknown> {
    const query = `
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            totalQuantity
            estimatedCost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              nodes {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query(query, { cartId, lines });

    if (result.cartLinesUpdate.userErrors?.length) {
      throw new Error(
        `Cart update failed: ${result.cartLinesUpdate.userErrors.map((e: { message: string }) => e.message).join(", ")}`
      );
    }

    return result.cartLinesUpdate.cart;
  }

  /**
   * Remove lines from cart
   */
  async removeFromCart(cartId: string, lineIds: string[]): Promise<unknown> {
    const query = `
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            totalQuantity
            estimatedCost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              nodes {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query(query, { cartId, lineIds });

    if (result.cartLinesRemove.userErrors?.length) {
      throw new Error(
        `Remove from cart failed: ${result.cartLinesRemove.userErrors.map((e: { message: string }) => e.message).join(", ")}`
      );
    }

    return result.cartLinesRemove.cart;
  }

  /**
   * Get cart by ID
   */
  async getCart(cartId: string): Promise<unknown> {
    const query = `
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          createdAt
          updatedAt
          checkoutUrl
          totalQuantity
          estimatedCost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
            totalDutyAmount {
              amount
              currencyCode
            }
          }
          lines(first: 100) {
            nodes {
              id
              quantity
              estimatedCost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    id
                    title
                    handle
                  }
                  image {
                    id
                    url
                    altText
                    width
                    height
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query(query, { cartId });
    return result.cart;
  }
}

/**
 * Factory function to create Shopify service instance
 */
export function createShopifyStorefrontService(domain: string, accessToken: string) {
  return new ShopifyStorefrontService({ domain, accessToken });
}
