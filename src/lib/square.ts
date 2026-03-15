import { SquareClient } from "square";

export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox",
});
