import { Router } from "express";
import prisma from "../lib/db.js";

const router = Router();

router.post("/create", async (req, res) => {
  const {
    EndDate,
    StartDate,
    Center,
    TrainerID,
    MonitorID,
    CourseID,
    DeliverablesStatus,
  } = req.body;

  try {
    if (
      !EndDate &&
      !StartDate &&
      !Center &&
      !TrainerID &&
      !MonitorID &&
      !CourseID
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();
    const course = await prisma.course.findFirst({
      where: {
        CourseID: +CourseID,
      },
    });
    const data = await prisma.trainingsessions.create({
      data: {
        ProgramID: +course.ProgramID,
        EndDate: endDate,
        StartDate: startDate,
        Center,
        TrainerID: +TrainerID,
        MonitorID: +MonitorID,
        CourseID: +CourseID,
        DeliverablesStatus,
      },
    });

    res.redirect("/admin/sessions");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.patch("/update/:id", async (req, res) => {
  const {
    ProgramID,
    EndDate,
    StartDate,
    Center,
    TrainerID,
    MonitorID,
    Course,
    DeliverablesStatus,
  } = req.body;

  try {
    if (
      !ProgramID &&
      !EndDate &&
      !StartDate &&
      !Center &&
      !TrainerID &&
      !MonitorID &&
      !Course
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();

    const data = await prisma.trainingsessions.update({
      where: {
        SessionID: +req.params.id,
      },
      data: {
        ProgramID: +ProgramID,
        EndDate: endDate,
        StartDate: startDate,
        Center,
        TrainerID: +TrainerID,
        MonitorID: +MonitorID,
        Course,
        DeliverablesStatus,
      },
    });

    res.redirect("/admin/sessions");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.sessions.findUnique({
      where: {
        SessionID: req.params.id,
      },
    });

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
