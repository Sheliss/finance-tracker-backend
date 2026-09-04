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

//Edit transaction

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const rawId = req.params.id;
    const { title, amount, type, category, date, note } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = typeof rawId === "string" ? rawId : undefined;
    if (!id) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    // Check if transaction exists and belongs to current user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Edit transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        title: title ?? existingTransaction.title,
        amount:
          amount !== undefined
            ? parseFloat(amount)
            : existingTransaction.amount,
        type: type ?? existingTransaction.type,
        category: category ?? existingTransaction.category,
        date: date ?? existingTransaction.date,
        note: note !== undefined ? note : existingTransaction.note,
      },
    });

    return res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error("Update transaction error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Delete transaction

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const rawId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = typeof rawId === "string" ? rawId : undefined;
    if (!id) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    // Check if the transaction exists AND belongs to this user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
