require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/notes", require("./routes/noteRoutes"));

app.use("/api/requests", require("./routes/requestRoutes"));

app.use("/api/users", require("./routes/userRoutes"));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('StudyMate API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
