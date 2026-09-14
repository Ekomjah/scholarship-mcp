import "dotenv/config";
export const config = {
  mongodbUri: process.env.MONGODB_URI,
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
};
