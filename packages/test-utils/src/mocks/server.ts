import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server for mocking API requests in tests
 */
export const server = setupServer(...handlers);
