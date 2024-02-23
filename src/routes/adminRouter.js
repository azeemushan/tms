import { UserType } from "@prisma/client";
import { hash } from "bcrypt";
import { Router } from "express";
import prisma from "../lib/db.js";
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
    const sessions = await prisma.trainingsessions.count({
      where: {
        ProgramID: +req.params.id,
      },
    });

    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const courses = await prisma.course.count({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const trainers = await prisma.users.count({
      where: {
        UserType: UserType.TRAINER,
        ProgramID: req.params.id,
      },
    });
    const participants = await prisma.users.count({
      where: {
        UserType: UserType.STUDENT,
        ProgramID: req.params.id,
      },
    });

    res.render("admin/singleProgram", {
      sessions,
      courses,
      trainers,
      program,
      participants,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.delete("/program/:id", async (req, res) => {
  try {
    const program = await prisma.programs.delete({
      where: {
        ProgramID: +req.params.id,
      },
    });

    res.status(200).json({ message: "deleted succesfully" });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id/sessions", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const sessions = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +req.params.id,
      },
      include: {
        course: true,
        programs: true,
      },
    });

    res.render("admin/sessions", { sessions, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    console.log(
      "🚀 ~ file: adminRouter.js: url=/programs/:id/sessions ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/organizations", async (req, res) => {
  try {
    const data = await prisma.thirdparties.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.render("admin/organizations", { clients: data });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/organizations ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/clients", async (req, res) => {
  try {
    const data = await prisma.client.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.render("admin/clients", { clients: data });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=clients ~ router.get ~ error:",
      error
    );
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

router.get("/organization/:id/programs", async (req, res) => {
  try {
    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    const programs = await prisma.programs.findMany({
      where: {
        DonorOrganizationID: +req.params.id,
      },
    });

    res.render("admin/organizationPrograms", {
      programs,
      organization,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/organization/:id/clients", async (req, res) => {
  try {
    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ organization:", organization);
    const clients = await prisma.client.findMany({
      where: {
        ThirdPartyID: +req.params.id,
      },
      include: {
        user: true,
        thirdparty: true,
      },
    });
    console.log("🚀 ~ router.get ~ clients:", clients[0]);

    res.render("admin/organizationClients", {
      clients,
      organization,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id/courses", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const courses = await prisma.course.findMany({
      where: {
        ProgramID: +req.params.id,
      },
      include: {
        program: true,
        sessions: true,
      },
    });
    console.log("🚀 ~ router.get ~ courses:", courses);

    res.render("admin/programCourses", {
      courses,
      program,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/programs/:id/trainers", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
        ProgramID: req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ trainers:", trainers);

    res.render("admin/programTrainers", {
      trainers,
      program,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/programs/:id/participants", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.STUDENT,
        ProgramID: req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ trainers:", trainers);

    res.render("admin/programParticipants", {
      trainers,
      program,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const course = await prisma.course.findFirst({
      where: {
        CourseID: +req.params.id,
      },
    });
    const sessions = await prisma.trainingsessions.findMany({
      where: {
        CourseID: +req.params.id,
      },
      include: {
        course: true,
        programs: true,
      },
    });
    console.log("🚀 ~ router.get ~ sessions:", sessions);

    res.render("admin/singleCourse", {
      sessions,
      course,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/clients/create", async (req, res) => {
  try {
    const organizations = await prisma.thirdparties.findMany();
    res.render("admin/createClient", { organizations });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/clients/create ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.post("/clients/create", async (req, res) => {
  const { Username, Password, Email, ThirdPartyID } = req.body;

  try {
    if (!Username && !Password && !Email && !ThirdPartyID) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let hashedPassword = await hash(Password, 10);

    const newUser = await prisma.users.create({
      data: {
        Username,
        Password: hashedPassword,
        Email,
        UserType: UserType.CLIENT,
        client: {
          create: {
            ThirdPartyID: +ThirdPartyID,
          },
        },
      },
      include: {
        client: true,
      },
    });

    res.redirect("/admin/dashboard");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/organizations/create", async (req, res) => {
  try {
    res.render("admin/createOrganization");
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/organizations/create ~ router.get ~ error:",
      error
    );
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
    console.log(
      "🚀 ~ file: adminRouter.js:url=/session/update/:id ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const data = await prisma.trainingsessions.findMany({
      include: {
        course: true,
        programs: true,
      },
    });

    if (!data) return res.redirect("/admin/dashboard");

    res.render("admin/allSessions", {
      sessions: data,
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/sessions ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
    });

    const participants = await prisma.Participant.count({
      where: {
        sessionId: +id,
      },
    });

    const assignments = await prisma.assignments.count({
      where: {
        SessionID: +id,
      },
    });

    const documents = await prisma.documents.count({
      where: {
        SessionID: +id,
      },
    });
    const quizes = await prisma.Quiz.count({
      where: {
        SessionID: +id,
      },
    });

    if (!data) return res.redirect("/admin/sessions");

    res.render("admin/singleSession", {
      session: data,
      participants,
      assignments,
      documents,
      quizes,
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/sessions/:id ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/session/:id/participants", async (req, res) => {
  try {
    const participants = await prisma.Participant.findMany({
      where: {
        sessionId: +req.params.id,
      },
    });
    console.log("🚀 ~ router.get ~ participants:", participants);

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/sessionParticipants", {
      participants,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/assignments", async (req, res) => {
  try {
    const data = await prisma.assignments.findMany({
      where: {
        SessionID: +req.params.id,
        isUploadedByTrainer: false,
      },
      include: {
        trainingsessions: true,
      },
    });

    let assignments = [];
    for (let i = 0; i < data.length; i++) {
      const program = await prisma.programs.findFirst({
        where: {
          ProgramID: data[i].trainingsessions.ProgramID,
        },
      });
      assignments.push({ ...data[i], program: program.Name });
    }

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/assignments", {
      assignments,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/documents", async (req, res) => {
  try {
    const documents = await prisma.documents.findMany({
      where: {
        SessionID: +req.params.id,
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/sessionDocuments", {
      documents,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/materials", async (req, res) => {
  try {
    const materials = await prisma.materials.findMany({
      where: {
        SessionID: +req.params.id,
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/trainingMaterial", {
      materials,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/materials/create", async (req, res) => {
  try {
 const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/createMaterial", {
      session,
    });

  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/quizes", async (req, res) => {
  try {
    const quizes = await prisma.Quiz.findMany({
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        SubmittedQuizes: true,
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/quizes", {
      quizes,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/documents", async (req, res) => {
  try {
    const documents = await prisma.documentType.findMany();

    res.render("admin/documents", {
      documents
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/document/create", async (req, res) => {
  const {Name} = req.body

  try {
    const documentExist = await prisma.documentType.findFirst({
      where: {
        Name
      }
    });

    if (documentExist) {
      return res.status(400).json({
        message: `Document ${Name} already exists`
      })
    }

    const newDocument = await prisma.documentType.create({
      data: {
        Name
      }
    })
    res.redirect("/admin/documents");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.delete("/document/:id", async (req, res) => {
  try {
    const document = await prisma.documentType.delete({
      where: {
        DocumentTypeID: +req.params.id,
      },
    });

    res.status(200).json({ message: "deleted succesfully" });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id", async (req, res) => {
  try {
    let SubmittedQuizes = [];
    const data = await prisma.Quiz.findUnique({
      where: { id: +req.params.id },
      include: {
        SubmittedQuizes: true,
      },
    });

    for (let i = 0; i < data.SubmittedQuizes.length; i++) {
      const user = await prisma.users.findUnique({
        where: {
          UserID: +data.SubmittedQuizes[i].UserID,
        },
      });
      SubmittedQuizes.push({ ...data.SubmittedQuizes[i], user });
    }
    console.log("🚀 ~ router.get ~ SubmittedQuizes:", SubmittedQuizes);

    res.render("admin/singleQuiz", {
      SubmittedQuizes,
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id/create", async (req, res) => {
  try {
    res.render("admin/createQuiz", { SessionID: req.params.id });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/quiz/create", async (req, res) => {
  const { quizData, name, SessionID } = req.body;

  try {
    // Create Quiz
    const quiz = await prisma.Quiz.create({
      data: {
        name,
        SessionID: +SessionID,
        questions: {
          create: quizData.map((question) => ({
            question: question.question,
            answer: question.answer,
            options: {
              create: question.options.map((option) => ({
                value: option,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    res.json({ redirectTo: `/admin/session/${SessionID}/quizes` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/session/create", async (req, res) => {
  console.log("🚀 ~ router.get ~ centers: runned");
  try {
    const centers = await prisma.centers.findMany();
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });
    const monitors = await prisma.users.findMany({
      where: {
        UserType: UserType.MONITOR,
      },
    });
    const courses = await prisma.course.findMany();

    res.render("admin/createSession", { trainers, monitors, centers, courses });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id/courses/create", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    res.render("admin/createCourse", { program });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/programs/:id/courses/create", async (req, res) => {
  try {
    const { Name } = req.body;
    const ProgramID = req.params.id;
    console.log("🚀 ~ router.post ~ ProgramID:");
    console.log("🚀 ~ router.post ~ ProgramID:", ProgramID);
    console.log("🚀 ~ router.post ~ Name:", Name);
    if (!Name && !ProgramID) {
      return res.status(400).json({ message: "Please Fillout all the fields" });
    }
    const data = await prisma.course.create({
      data: {
        Name,
        ProgramID: +ProgramID,
      },
    });

    res.redirect(`/admin/programs/${ProgramID}/courses`);
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
    const data = await prisma.centers.findMany();
    let centers = [];

    for(let i = 0; i < data.length; i++) {
      let center = data[i]
      center.isPublicSector = center.isPublicSector ? "Yes": "No"
      center.haveComputerLab = center.haveComputerLab ? "Yes": "No"

      centers.push(center)
    }
    

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

    const managers = await prisma.users.findMany({
      where: {
        UserType: UserType.MANAGER
      }
    });

    const documentType = await prisma.documentType.findMany()

    res.render("admin/createProgram", { donors, managers, documentType });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/program/create", async (req, res) => {
  const { Name, StartDate, EndDate, DonorOrganization, Description, Category,documentTypes } =
    req.body;

    console.log("🚀 ~ router.post ~ endDate:", req.body);   
  try {
    if (
      !Name ||
      !EndDate ||
      !StartDate ||
      !DonorOrganization ||
      !Description ||
      !Category
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();

    const data = await prisma.programs.create({
      data: {
        Name,
        EndDate: endDate,
        Startdate: startDate,
        DonorOrganizationID: +DonorOrganization,
        Description,
        Category,
        Documents: {
          connect: documentTypes.map((docTypeId) => ({
        DocumentTypeID: +docTypeId,
      })),
        }
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

    console.log('🚀 ~ router.post ~ data:', data);
    
    if (!data) return res.status(400).json({ error: "Missing fields" });
    res.redirect("/admin/centers");
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/reports", async (_, res) => {
  try {
    const programs = await prisma.programs.findMany({
      include: {
        thirdparty: true,
      },
    });
    res.render("admin/reports", { programs });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

// all reports of a program
router.get("/reports/:id", async (req, res) => {
  try {
    const id = +req.params.id; // Convert to number

    // Use `findFirst` to find a single record
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: id,
      },
    });

    console.log("🚀 ~ router.get ~ program:", program);

    if (!program) {
      throw new Error(`Program with ID ${id} not found`);
    }

    const reports = await prisma.report.findMany({
      where: {
        ProgramID: +id,
      },
      include: {
        SubmitedReports: true,
      },
    });

    res.render("admin/programReports", { program, reports });
  } catch (error) {
    console.error("🚀 ~ router.get ~ error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// single report
router.get("/report/:id", async (req, res) => {
  try {
    const id = +req.params.id; // Convert to number
    const report = await prisma.submitedReport.findMany({
      where: {
        ReportID: +id,
      },
      include: {
        report: true,
      },
    });

    const mainReport = await prisma.report.findFirst({
      where: {
        ReportID: +id,
      },
    });
    console.log("🚀 ~ router.get ~ report:", report, mainReport);

    if (!report) {
      throw new Error(`Program with ID ${id} not found`);
    }

    res.render("admin/singleReport", {
      report,
      mainReport,
    });
  } catch (error) {
    console.error("🚀 ~ router.get ~ error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/reports/:id/create", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });

    res.render("admin/createReport", { program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

export default router;
