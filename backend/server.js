import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoutes.js";
import doctorRouter from "./routes/doctorRoutes.js";
import userRouter from "./routes/userRoute.js";
import medicalCopilotRouter from "./routes/medicalCopilotRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import { rateLimit } from "express-rate-limit";
import doctorModel from "./models/doctorModel.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

connectDB();
connectCloudinary();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});

app.use(limiter);

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://prescripto-admin-lyart.vercel.app", "https://prescripto-o5lf.vercel.app"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/user", medicalCopilotRouter);
app.use("/api/reviews", reviewRouter);

app.get("/sitemap.xml", async (req, res) => {
  try {
    const doctors = await doctorModel.find({ available: true }).select('_id');
    const baseUrl = "https://prescripto-frontend-yxxn.onrender.com"; 

    // Static pages
    const urls = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/doctors`, priority: "0.9", changefreq: "daily" },
      { loc: `${baseUrl}/about`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly" },
    ];

    // Dynamic Doctor pages
    doctors.forEach(doc => {
      urls.push({
        loc: `${baseUrl}/appointments/${doc._id}`,
        priority: "0.8",
        changefreq: "weekly"
      });
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls
        .map(
          (url) => `
        <url>
          <loc>${url.loc}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>${url.changefreq}</changefreq>
          <priority>${url.priority}</priority>
        </url>`
        )
        .join("")}
    </urlset>`;

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap error:", error);
    res.status(500).end();
  }
});

app.get("/", (req, res) => {
  res.send("API Working with Security & SEO enhancements");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
