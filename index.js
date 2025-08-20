import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// السماح بالوصول من أي مكان (CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// راوت البروكسي
app.get("/proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy request failed", details: error.message });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
