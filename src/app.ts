// src/app.ts

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./core/errors/errorHandler";

const app: Application = express();
const allowedOrigins = config.frontendUrl.split(",");
// example: FRONTEND_URL=http://localhost:3000,https://yourdomain.com

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  })
);


// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes); // root API prefix

// Error handling
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default app;
