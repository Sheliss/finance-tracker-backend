import { Router } from "express";
import { verifyToken, type AuthRequest } from "../middleware/auth.js";
import prisma from "../prisma.js";

const router = Router();

router.use(verifyToken);

//Get all transaction for current user
router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" }, // Latest first
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create bew transaction
router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { title, amount, type, category, date, note } = req.body;

    if (!title || amount === undefined || !type || !category || !date) {
      return res
        .status(400)
        .json({ error: "Missing required transaction fields" });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        title,
        amount: parseFloat(amount),
        type,
        category,
        date,
        note: note || null,
        userId: userId!,
      },
    });

    return res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Create transaction error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
