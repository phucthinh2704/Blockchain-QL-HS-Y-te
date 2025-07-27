const express = require("express");
const cors = require("cors");
const initRoutes = require("./routes");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const db = require("./config/database");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to database
db.connectDB();

// Routes
initRoutes(app);

// Start server
app.listen(PORT, () => {
	console.log(`🏥 Medical Records Blockchain Server running on port http://localhost:${PORT}`);
});
