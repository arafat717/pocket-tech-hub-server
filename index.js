const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("basic-node-server");
    const collection = db.collection("users");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================

    const productsCollection = client.db("pocket-tech").collection("products");

    // get all products
    app.get("/api/v1/products", async (req, res) => {
      try {
        const result = await productsCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // get single product /////
    app.get("/api/v1/products/:productid", async (req, res) => {
      const id = req.params.productid;
      try {
        if (!mongodb.ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID format" });
        }

        const query = { _id: new mongodb.ObjectId(id) };
        const result = await productsCollection.findOne(query);

        if (!result) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // get all flashsale
    app.get("/api/v1/flashsale", async (req, res) => {
      const result = await productsCollection
        .find({ flashSale: true, discount: { $exists: true, $ne: null } })
        .toArray();
      res.send(result);
    });

    // top rated product//////
    app.get("/api/v1/topRatedProducts", async (req, res) => {
      try {
        const topRatedProducts = await productsCollection
          .find()
          .sort({ ratings: -1 })
          .toArray();
        res.json(topRatedProducts);
      } catch (error) {
        console.error("Error fetching top-rated products:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
