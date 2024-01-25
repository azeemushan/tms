import { Router } from "express";
import prisma from "../lib/db.js";
const router = Router();

// Routes
router.get("/dashboard", async (req, res) => {
  try {
    const assignments = await prisma.assignments.findMany({
      where: {
        isUploadedByTrainer: true,
      },
    });
    res.render("student/dashboard", { assignments });
  } catch (error) {}
});

router.get("/documents", async (req, res) => {
  try {
    const assignments = await prisma.assignments.findMany({
      where: {
        isUploadedByTrainer: true,
      },
    });
    res.render("student/documents", { assignments });
  } catch (error) {}
});

router.get("/feedbacks", async (req, res) => {
  try {
    const feedbacks = await prisma.Feedback.findMany({
      where: {
        CreatedByAdmin: true,
      },
      include: {
        Inputs: true,
      },
    });
    console.log("🚀 ~ router.get ~ feedbacks:", feedbacks);
    res.render("student/feedbacks", { feedbacks });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/feedback/create", async (req, res) => {
  try {
    const inputs = req.body;
    console.log("🚀 ~ router.post ~ inputs:", inputs);

    const newFeedback = await prisma.Feedback.create({
      data: {
        CreatedByAdmin: false,
      },
    });

    const feedbackInputs = Object.entries(inputs).map(async ([name, value]) => {
      return prisma.FeedbackInput.create({
        data: {
          Name: name,
          Value: value,
          feedbackID: newFeedback.FeedbackID,
        },
      });
    });

    // console.log("🚀 ~ router.get ~ feedbacks:", feedbacks);
    res.redirect("/student/feedbacks");
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/feedback/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const feedback = await prisma.Feedback.findFirst({
      where: {
        FeedbackID: +id,
      },
      include: {
        Inputs: true,
      },
    });
    console.log("🚀 ~ router.get ~ feedback:", feedback);
    res.render("student/singleFeedback", { feedback });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/upload", async (req, res) => {
  try {
    const data = await prisma.programs.findMany();
    const donors = await prisma.thirdparties.findMany();
    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.render("student/upload", { programs: data, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
