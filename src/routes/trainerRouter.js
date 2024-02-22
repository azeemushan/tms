import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
const router = Router();

// Routes
router.get("/dashboard", async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) res.redirect("/login");
    const { UserID } = jwt.decode(token);

    const sessions = await prisma.trainingsessions.findMany({
      where: {
        TrainerID: +UserID,
      },
      include: {
        course: true,
        programs: true,
      },
    });
    res.render("trainer/dashboard", { sessions });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(400).json({
      message: "Something Went Wrong",
    });
  }
});
router.get("/profile", async (req, res) => {
  try {
    const { token } = req.cookies;

    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +userData.ProgramID,
      },
    });

    res.render("trainer/profile", { user: userData, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});
router.get("/:id/assignments", async (req, res) => {
  try {
    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    const documents = await prisma.assignments.findMany({
      where: {
        SessionID: +req.params.id,
        isUploadedByTrainer: false,
      },
    });
    console.log("🚀 ~ router.get ~ documents:", documents);

    const assignments = documents.map((item) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
    }));

    if (!session)
      return res.status(400).json({ message: "something went wrong" });

    res.render("trainer/assignments", { session, assignments });
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
