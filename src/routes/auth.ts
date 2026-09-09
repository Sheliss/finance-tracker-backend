import { Router } from "express";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import { verifyToken, type AuthRequest } from "../middleware/auth.js";
import crypto from "crypto";

import { emailText } from "../utils/emailTemplates.js";

const router = Router();
const resend = new Resend(process.env.RESEND_API);
const frontendUrl = process.env.FRONTEND_URL;

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

    //Verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    //Save user to db
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
      },
    });

    //Verification email via Resend API
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    await resend.emails.send({
      from: "finance-tracker@harukanyan.space",
      to: email,
      subject: "Verify your email for finance tracker",
      html: emailText(verificationLink),
    });

    return res.status(201).json({
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

router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification link" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: "Internal server error" });
    }

    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Email verified successfully!",
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
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

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Please verify your email address before logging in." });
    }

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

//Get current user
router.get("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
