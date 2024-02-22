import { Router } from "express";
import jwt from "jsonwebtoken";
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

router.get("/profile", async (req, res) => {
  try {
    const { token } = req.cookies;

    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +userData.ProgramID,
      },
    });

    res.render("student/profile", { user: userData, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
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

router.get("/quizes", async (req, res) => {
  const { token } = req.cookies;

  const userData = jwt.verify(token, process.env.JWT_SECRET);
  try {
    const quizes = await prisma.Quiz.findMany({
      where: {
        SessionID: +userData.SessionID,
        SubmittedQuizes: {
          none: {
            UserID: +userData.UserID,
          },
        },
      },
      include: {
        SubmittedQuizes: true,
      },
    });

    res.render("student/quizes", {
      quizes,
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id", async (req, res) => {
  try {
    res.render("student/singleQuiz");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id/data", async (req, res) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: +req.params.id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    res.status(200).json({ quiz });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/quiz/:id/create", async (req, res) => {
  const { QuizID, QuizName, SessionID, score } = req.body.SubmissionData;
  console.log(
    "🚀 ~ router.post ~ QuizID, QuizName, SessionID, score:",
    QuizID,
    QuizName,
    SessionID,
    score
  );
  const { token } = req.cookies;

  const userData = jwt.verify(token, process.env.JWT_SECRET);
  try {
    // Create Quiz
    const quiz = await prisma.SubmittedQuiz.create({
      data: {
        name: QuizName,
        score: +score,
        UserID: +userData.UserID,
        QuizID: +QuizID,
        SessionID: +SessionID,
      },
    });

    res.json({ redirectTo: "/student/quizes" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
