import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import demoRoutes from "./routes/demo.routes.js";
import accessorizeRoutes from "./routes/accessorize.routes.js";
import contactRoutes from "./routes/contect.routes.js";
import categoryRoutes from "./routes/category.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // important for form-data
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Welcome to the API"));

app.use("/api/demo", demoRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/accessorize", accessorizeRoutes);
app.use("/api/categories", categoryRoutes);


export default app;
