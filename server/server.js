const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const app = express();

app.use(express.json());
app.use(cors());

// Serve static files first
const buildPath = path.join(__dirname, "../client/build");
app.use(express.static(buildPath));

// API Routes should be defined BEFORE the wildcard route
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/routes"));

// Fix for React Router: Serve index.html for non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// Centralized error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).send({ error: err.message, details: err.details });
});

const port = config.PORT || 5002;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
