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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        skip: skip, // Skip records of previous pages
        take: limit, // Take only the amount for this page (e.g., 10)
      }),
      prisma.transaction.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      data: transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Dashboard stats and caluclations

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    //Fetch all user transactions to compute analytics
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    //Total Balance (All Incomes minus All Expenses)
    const totalBalance = transactions.reduce((acc, t) => {
      return t.type.toLowerCase() === "income"
        ? acc + t.amount
        : acc - t.amount;
    }, 0);

    //Filter current month transactions
    const currentMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
      );
    });

    //Current Month Income & Expenses
    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.type.toLowerCase() === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpense = currentMonthTransactions
      .filter((t) => t.type.toLowerCase() === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    //Recent 5 Expenses (or transactions)
    const recentExpenses = transactions.slice(0, 5);

    //Current Month Expenses by Category
    const categoryMap: { [key: string]: number } = {};
    currentMonthTransactions
      .filter((t) => t.type.toLowerCase() === "expense")
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

    const spendingByCategory = Object.entries(categoryMap).map(
      ([category, amount]) => ({
        category,
        amount,
      }),
    );

    //Total Spendings for Past 12 Months (for charts)
    const pastMonthsExpenses = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i);
      const mMonth = d.getMonth();
      const mYear = d.getFullYear();

      const monthExpenseSum = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type.toLowerCase() === "expense" &&
            tDate.getMonth() === mMonth &&
            tDate.getFullYear() === mYear
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      pastMonthsExpenses.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        year: mYear,
        amount: monthExpenseSum,
      });
    }

    // Return the bundled stats package
    return res.status(200).json({
      totalBalance,
      currentMonthIncome,
      currentMonthExpense,
      recentExpenses,
      spendingByCategory,
      pastMonthsExpenses,
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
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
