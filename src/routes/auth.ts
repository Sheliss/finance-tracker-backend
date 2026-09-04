import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import jwt from "jsonwebtoken";

const router = Router();

//User register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    //Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    //Check if user exists already

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    //Hasing password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Save user to db
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return res.sendStatus(201).json({
      message: {
        id: newUser.id,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    //Find user in db by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    //Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "7d",
    });

    //Send response with token
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
