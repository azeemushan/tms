import { Router } from "express";
import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
const router = Router();

// Routes
router.get("/dashboard", (req, res) => {
  res.render("monitor/dashboard");
});

router.get("/assignments", async (req, res) => {
  try {
    const data = await prisma.programs.findMany();
    const donors = await prisma.thirdparties.findMany();
    const documents = await prisma.assignments.findMany({
      where: {
        isUploadedByTrainer: false,
      },
    });

    const assignments = documents.map((item) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
    }));

    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.render("monitor/assignments", { programs: data, donors, assignments });
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
