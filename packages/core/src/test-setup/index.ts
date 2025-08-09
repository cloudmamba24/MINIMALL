// Main test setup exports
export * from "./base";
export * from "./react";
export * from "./next-app";
export * from "./next-pages";
export * from "./shopify";

// Convenience setup functions
export const setupReactTests = () => {
  require("./base");
  require("./react");
};

export const setupAdminTests = () => {
  require("./base");
  require("./react");
  require("./next-pages");
  require("./shopify");
};

export const setupPublicTests = () => {
  require("./base");
  require("./react");
  require("./next-app");
};
