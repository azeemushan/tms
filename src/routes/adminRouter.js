import { UserType } from "@prisma/client";
import { Router } from "express";
import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
const router = Router();

// Routes
router.get("/dashboard/data", async (req, res) => {
  try {
    const students = await prisma.users.findMany({
      where: {
        UserType: UserType.STUDENT,
      },
    });
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });
    const sessions = await prisma.trainingsessions.findMany();
    const programCategories = await prisma.programs.groupBy({
      by: ["Category"],
      _count: {
        Category: true,
      },
    });

    const groupedData = programCategories.map((entry) => ({
      [entry.Category]: entry._count.Category,
    }));

    res
      .status(200)
      .json({ students, trainers, sessions, programs: groupedData });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/dashboard", async (req, res) => {
  res.render("admin/dashboard");
});

router.get("/programs/data", async (req, res) => {
  try {
    const data = await prisma.programs.findMany();
    const donors = await prisma.thirdparties.findMany();
    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.json({ programs: data, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/programs", async (req, res) => {
  try {
    const data = await prisma.programs.findMany({
      include: {
        thirdparty: true,
      },
    });
    console.log("🚀 ~ router.get ~ data:", data);
    const donors = await prisma.thirdparties.findMany();
    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.render("admin/programs", { programs: data, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id", async (req, res) => {
  try {
    const data = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +req.params.id,
      },
    });

    const donors = await prisma.thirdparties.findMany();

    let sessions = [];

    for (let i = 0; i < data.length; i++) {
      let value = data[i].EndDate - data[i].StartDate;
      let days = Math.floor(value / (1000 * 60 * 60 * 24));

      let EndDate = formatDate(data[i].EndDate);
      let StartDate = formatDate(data[i].StartDate);

      let trainer = await prisma.users.findFirst({
        where: {
          UserID: data[i].TrainerID,
        },
      });

      let monitor = await prisma.users.findFirst({
        where: {
          UserID: data[i].MonitorID,
        },
      });
      let program = await prisma.programs.findFirst({
        where: {
          ProgramID: data[i].ProgramID,
        },
      });

      const session = {
        ...data[i],
        EndDate,
        StartDate,
        program: program.Name,
        Duration: days,
        trainer: trainer.Username,
        monitor: monitor.Username,
      };
      sessions.push(session);
    }

    res.render("admin/singleProgram", { sessions, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const data = await prisma.trainingsessions.findMany();
    const programs = await prisma.programs.findMany();
    const centers = await prisma.centers.findMany();
    const users = await prisma.users.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    let sessions = [];

    for (let i = 0; i < data.length; i++) {
      let value = new Date(data[i].EndDate) - new Date(data[i].StartDate);

      let days = Math.floor(value / (1000 * 60 * 60 * 24));

      let EndDate = formatDate(data[i].EndDate);
      let StartDate = formatDate(data[i].StartDate);

      let trainer = await prisma.users.findFirst({
        where: {
          UserID: data[i].TrainerID,
        },
      });

      let monitor = await prisma.users.findFirst({
        where: {
          UserID: data[i].MonitorID,
        },
      });
      let program = await prisma.programs.findFirst({
        where: {
          ProgramID: data[i].ProgramID,
        },
      });

      const session = {
        ...data[i],
        EndDate,
        StartDate,
        program: program.Name,
        Duration: days,
        trainer: trainer.Username,
        monitor: monitor.Username,
      };
      sessions.push(session);
    }

    res.render("admin/sessions", { sessions, programs, users, centers });
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/organizations", async (req, res) => {
  try {
    const data = await prisma.thirdparties.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.render("admin/organizations", { clients: data });
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/organization/:id", async (req, res) => {
  try {
    console.log("🚀 ~ router.get ~ first:");

    const programCount = await prisma.programs.count({
      where: {
        DonorOrganizationID: +req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ programCount:", programCount);
    console.log("🚀 ~ router.get ~ second:");

    const clientsCount = await prisma.client.count({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ clients:", clientsCount);
    console.log("🚀 ~ router.get ~ third:");

    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ organization:", organization);
    console.log("🚀 ~ router.get ~ fourth:");

    res.render("admin/singleOrganization", {
      programCount,
      clientsCount,
      organization,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/organizations/create", async (req, res) => {
  try {
    res.render("admin/createOrganization");
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/session/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
    });
    const programs = await prisma.programs.findMany();
    const centers = await prisma.centers.findMany();
    const users = await prisma.users.findMany();

    if (!data) return res.redirect("/admin/sessions");

    res.render("admin/updateSession", {
      session: data,
      programs,
      users,
      centers,
    });
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/session/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
    });

    const participants = await prisma.Participant.findMany({
      where: {
        sessionId: +id,
      },
    });

    const assignments = await prisma.assignments.findMany({});

    if (!data) return res.redirect("/admin/sessions");

    res.render("admin/singleSession", {
      session: data,
      participants,
      assignments,
    });
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/sessions/create", async (req, res) => {
  try {
    res.render("admin/createSession");
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/participants", async (req, res) => {
  try {
    const data = await prisma.Participant.findMany();

    const sessions = await prisma.trainingsessions.findMany();
    res.render("admin/participants", { participants: data, sessions });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/monitors", async (req, res) => {
  try {
    const monitors = await prisma.users.findMany({
      where: {
        UserType: UserType.MONITOR,
      },
    });

    res.render("admin/monitors", { monitors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/centers", async (req, res) => {
  try {
    const centers = await prisma.centers.findMany();

    res.render("admin/centers", { centers });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/trainers", async (req, res) => {
  try {
    let trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });

    let allTrainers = [];

    for (let i = 0; i < trainers.length; i++) {
      let trainer = trainers[i];
      let sessions = await prisma.trainingsessions.findMany({
        where: {
          TrainerID: +trainer.UserID,
        },
      });

      let programName;
      if (sessions.length) {
        let program = await prisma.trainingsessions.findFirst({
          where: {
            ProgramID: +sessions[0].ProgramID,
          },
        });
        programName = program.Name;
      }
      let count = sessions.length;
      let data = {
        ...trainer,
        sessionsCompleted: count,
        programName,
      };
      allTrainers.push(data);
    }

    res.render("admin/trainers", { trainers: allTrainers });
  } catch (error) {
    console.log("error trainer: ", error);
  }
});

router.get("/assignments", async (req, res) => {
  try {
    let assignments = await prisma.assignments.findMany({
      where: {
        isUploadedByTrainer: false,
      },
      include: {
        trainingsessions: true,
        marks: true,
      },
    });

    res.render("admin/assignments", { assignments });
  } catch (error) {
    console.log("error admin assignments: ", error);
  }
});

router.get("/feedbacks", async (req, res) => {
  res.render("admin/feedbacks");
});

router.get("/feedbacks/program/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const feedbacks = await prisma.Feedback.findMany({
      where: {
        ProgramID: id,
        CreatedByAdmin: false,
      },
      include: {
        Inputs: true,
      },
    });
    console.log("🚀 ~ router.get ~ feedbacks:", feedbacks[0].Inputs);
    res.render("admin/programFeedback", { feedbacks });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/feedback/create", async (req, res) => {
  try {
    const body = req.body;
    const inputs = Object.keys(body);

    const newFeedback = await prisma.feedback.create({
      data: {
        CreatedByAdmin: true,
      },
    });

    // Step 2: Create multiple FeedbackInput entries associated with the new Feedback

    for (let i = 0; i < inputs.length; i++) {
      await prisma.feedbackInput.create({
        data: {
          Name: inputs[i],
          feedbackID: newFeedback.FeedbackID,
        },
      });
    }
    return res.redirect("/admin/feedbacks");
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
  }
  res.render("admin/feedbacks");
});

router.get("/user/create", async (req, res) => {
  try {
    const programs = await prisma.programs.findMany();

    res.render("admin/createUser", { programs });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/program/create", async (_, res) => {
  try {
    const donors = await prisma.thirdparties.findMany();
    console.log("🚀 ~ router.get ~ donors:", donors);

    res.render("admin/createProgram", { donors });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/program/create", async (req, res) => {
  const {
    Name,
    StartDate,
    EndDate,
    DonorOrganization,
    Description,
    EligibilityCriteria,
    DocumentRequirements,
    Age,
    Category,
    Education,
    Gender,
  } = req.body;

  console.log(
    "🚀 ~ router.post ~ Name",
    StartDate,
    EndDate,
    DonorOrganization,
    Description,
    EligibilityCriteria,
    DocumentRequirements,
    Age,
    Category,
    Education,
    Gender,
    Name
  );

  try {
    if (
      !Name ||
      !EndDate ||
      !StartDate ||
      !DonorOrganization ||
      !Description ||
      !EligibilityCriteria ||
      !DocumentRequirements ||
      !Age
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();
    console.log("🚀 ~ router.post ~ endDate:", endDate);

    const data = await prisma.programs.create({
      data: {
        Name,
        EndDate: endDate,
        Startdate: startDate,
        DonorOrganization,
        Description,
        EligibilityCriteria,
        DocumentRequirements: +DocumentRequirements,
        Age,
        Category,
        Education,
        Gender,
      },
    });

    if (!data) return res.status(400).json({ error: "Missing fields" });
    res.redirect("/admin/programs");
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post("/center/create", async (req, res) => {
  const {
    Name,
    City,
    FocalPerson,
    SeatingCapacity,
    isPublicSector,
    haveComputerLab,
  } = req.body;

  try {
    if (
      !Name ||
      !City ||
      !FocalPerson ||
      !SeatingCapacity ||
      !isPublicSector ||
      !haveComputerLab
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const data = await prisma.centers.create({
      data: {
        Name,
        City,
        FocalPerson,
        SeatingCapacity: +SeatingCapacity,
        isPublicSector: Boolean(isPublicSector),
        haveComputerLab: Boolean(haveComputerLab),
      },
    });

    if (!data) return res.status(400).json({ error: "Missing fields" });
    res.redirect("/admin/centers");
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/reports", (req, res) => {
  res.render("admin/reports");
});

export default router;
