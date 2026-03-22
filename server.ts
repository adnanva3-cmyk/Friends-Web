import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    home: {
      heroTitle: "Building Foundations that Last Generations",
      heroSubtitle: "Engineering the Future",
      heroBg: "bg-red-500/5"
    },
    products: [
      { id: "1", name: "Standard Hollow Brick", image: "https://picsum.photos/seed/brick1/800/600", bgImage: "https://picsum.photos/seed/bg1/800/600", description: "High-strength load-bearing hollow bricks for modern construction.", category: "HOLLOW BRICKS", price: "" },
      { id: "2", name: "Zig-Zag Interlock", image: "https://picsum.photos/seed/interlock1/800/600", bgImage: "https://picsum.photos/seed/bg2/800/600", description: "Durable and aesthetic interlocking pavers for heavy-duty driveways.", category: "INTERLOCK", "price": "" },
      { id: "3", name: "Premium Grey Block", image: "https://picsum.photos/seed/brick2/800/600", bgImage: "https://picsum.photos/seed/bg3/800/600", description: "Smooth finish blocks for elegant exterior walls.", category: "HOLLOW BRICKS", "price": "" }
    ],
    slides: [
      { id: "s1", title: "Our Legacy", subtitle: "Since 1995", description: "Building a foundation of trust and quality for over three decades in the construction industry.", image: "https://picsum.photos/seed/legacy/1920/1080", layout: "split", type: "legacy", shape: "rectangle", rounded: "large", fit: "contained", align: "center" },
      { id: "s2", title: "Latest Updates", subtitle: "New Technology", description: "We've upgraded our manufacturing plant with state-of-the-art automated machinery for superior precision.", image: "https://picsum.photos/seed/tech/1920/1080", layout: "overlay", type: "news", shape: "rectangle", rounded: "large", fit: "contained", align: "center" },
      { id: "s3", title: "Trending Products", subtitle: "Eco-Friendly Bricks", description: "Our new line of sustainable, eco-friendly bricks is now the top choice for green building projects.", image: "https://picsum.photos/seed/eco/1920/1080", layout: "minimal", type: "trending", shape: "rectangle", rounded: "large", fit: "contained", align: "center" }
    ],
    contact: {
      phone: "+91 98765 43210",
      secondaryPhone: "+91 88765 43210",
      email: "info@friendsbricks.com",
      whatsapp: "+91 98765 43210",
      branches: [
        {
          name: "Main Branch",
          address: "Industrial Area, Phase II, Palakkad, Kerala - 678001",
          mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d977.8458380352358!2d75.86388360604744!3d11.37967832514358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba667cca92506bd%3A0xfeaaa668143354d5!2sFriends%20hollow%20bricks%20and%20inter%20Locke!5e0!3m2!1sen!2sin!4v1774172490444!5m2!1sen!2sin",
          mapLink: ""
        },
        {
          name: "Second Branch",
          address: "Palakkad, Kerala",
          mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125406.10178465492!2d76.5703816!3d10.815854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba86dfa087d31ad%3A0xf542d6eb6a244918!2sPalakkad%2C%20Kerala!5e0!3m2!1sen!2sin!4v1711090000000!5m2!1sen!2sin",
          mapLink: ""
        }
      ]
    }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Multer configuration for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // API Routes
  app.get("/api/data", (req, res) => {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        return res.status(404).json({ error: "Data file not found" });
      }
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      if (!content) {
        return res.status(500).json({ error: "Data file is empty" });
      }
      const data = JSON.parse(content);
      res.json(data);
    } catch (err) {
      console.error("Error reading data file:", err);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/data", (req, res) => {
    const data = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  });

  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
