import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import demoRoutes from "./routes/demo.routes.js";
import accessorizeRoutes from "./routes/accessorize.routes.js";
import contactRoutes from "./routes/contect.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import userRoutes from "./routes/auth.routes.js";
import tempRoutes from "./routes/temp.routes.js";
dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://silicon-frontend-5d1n.vercel.app",
      "https://www.siliconmeditech.in",
      "https://siliconmeditech.in"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Welcome to the API"));

app.use("/api/demo", demoRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/accessorize", accessorizeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/temp", tempRoutes);

export default app;
