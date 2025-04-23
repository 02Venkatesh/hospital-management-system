require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

// PostgreSQL pool
const pool = new Pool({
    user: "hospitaladmin",
    host: "localhost",
    database: "hospital_db",
    password: "Bunny@999999",
    port: 5432,
});

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../main")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Create userrs table if not exists
const createUserrsTableQuery = `
CREATE TABLE IF NOT EXISTS "userrs" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    profilepic VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

pool.query(createUserrsTableQuery)
    .then(() => console.log("✅ Userrs table is ready."))
    .catch((err) => console.error("❌ Error creating userrs table:", err));

// API: Register with profile pic upload
app.post("/register", upload.single("profilePic"), async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;
        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const profilePic = req.file ? req.file.filename : null;

        const query = `
            INSERT INTO "userrs" (name, email, password, phone, profilepic)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await pool.query(query, [fullName, email, password, phone, profilePic]);

        res.json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// API: Login (without password hashing)
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "All fields are required" });

        const result = await pool.query('SELECT * FROM "userrs" WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

        const user = result.rows[0];
        
        // Compare passwords directly (no hashing)
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Just send JWT token (no session)
        const token = jwt.sign({ userId: user.id }, "supersecrettoken12345", { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// API: Book appointment
app.post("/api/book-appointment", async (req, res) => {
    const { firstName, lastName, phone, email, problem, hospital, doctor, dateTime } = req.body;
    try {
        await pool.query(
            `INSERT INTO appointments 
            (first_name, last_name, phone, email, problem, hospital, doctor, appointment_time) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [firstName, lastName, phone, email, problem, hospital, doctor, dateTime]
        );
        res.json({ success: true });
    } catch (err) {
        if (err.code === "23505") {
            res.json({ success: false, message: "Time slot already booked for this doctor!" });
        } else {
            console.error(err);
            res.status(500).json({ success: false, message: "Server error." });
        }
    }
});

// API: Contact form
app.post("/contact", async (req, res) => {
    const { firstName, lastName, email, phone, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "sveeramurugan869@gmail.com",
            pass: "jvryjsmuzgeumvrq",
        },
    });

    const mailOptions = {
        from: email,
        to: "bvenkatesh0207@gmail.com",
        subject: "New Contact Form Submission - CareLink",
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong><br>${message}</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Failed to send email" });
    }
});
// API endpoint for handling emergency requests
app.post("/api/emergency", async (req, res) => {
    const { requestType, location } = req.body;
  
    // Check if the request type and location are provided
    if (!requestType || !location) {
      return res.status(400).json({ message: "Missing required fields." });
    }
  
    try {
      // Extract latitude and longitude from the location (assuming it's in "latitude,longitude" format)
      const [latitude, longitude] = location.split(',');
  
      // Construct the Google Maps URL
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  
      // Setup the email transporter using Gmail
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "sveeramurugan869@gmail.com", // Replace with your email
          pass: "jvryjsmuzgeumvrq", // Replace with your app password
        },
      });
  
      // Prepare the email options
      const mailOptions = {
        from: "sveeramurugan869@gmail.com", // Replace with your email
        to: "bvenkatesh0207@gmail.com", // Replace with the recipient's email (e.g., hospital or emergency service)
        subject: `🚨 Emergency Request: ${requestType}`,
        html: `
          <h2>Emergency Alert</h2>
          <p><strong>Type of Emergency:</strong> ${requestType}</p>
          <p><strong>Current Location:</strong> <a href="${googleMapsUrl}" target="_blank">Click here to view on Google Maps</a></p>
        `,
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
  
      // Send success response
      res.status(200).json({ message: "Emergency request email sent successfully." });
    } catch (err) {
      console.error("Error handling emergency request:", err);
      res.status(500).json({ message: "Failed to send emergency request." });
    }
  });

// Serve frontend home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./login.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
