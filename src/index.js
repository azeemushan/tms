import { hash } from "bcrypt";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import hbs from "express-hbs";
import handlebarsEqual from "handlebars-helper-equal";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import prisma from "./lib/db.js";
import adminRouter from "./routes/adminRouter.js";
import managerRouter from "./routes/managerRouter.js";
import monitorRouter from "./routes/monitorRouter.js";
import participantRouter from "./routes/participants.js";
import programRouter from "./routes/program.js";
import sessionRouter from "./routes/session.js";
import studentRouter from "./routes/studentRouter.js";
import trainerRouter from "./routes/trainerRouter.js";
import uploadRouter from "./routes/uploadData.js";
import userRouter from "./routes/userRouter.js";

// let today = new Date();
// let dayOfWeek = today.getDay();

// // Restrict access on a specific day (e.g., Monday)
// if (dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0 && dayOfWeek !== 1) {
//   throw new Error("Server is not responding. Please contact your developer");
// }

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicPath = resolve(__dirname, "views");

dotenv.config({
  path: "../",
});

const app = express();

const port = process.env.PORT || 5000;

hbs.registerHelper("eq", handlebarsEqual);

app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.json());
app.use(express.static("public"));

app.engine(
  "hbs",
  hbs.express4({
    partialsDir: __dirname + "/views/partials",
    layoutsDir: __dirname + "/views/layouts",
  })
);
app.set("view engine", "hbs");
app.set("views", publicPath);

app.use("/files", uploadRouter);
app.use("/", userRouter);
app.use("/program", programRouter);
app.use("/session", sessionRouter);
app.use("/participant", participantRouter);
app.use("/admin", adminRouter);
app.use("/manager", managerRouter);
app.use("/monitor", monitorRouter);
app.use("/student", studentRouter);
app.use("/trainer", trainerRouter);

app.post("/organization/create", async (req, res) => {
  const { Name } = req.body;
  const created = await prisma.thirdparties.create({
    data: {
      Name,
    },
  });

  return res.redirect("/admin/organizations");
});
app.post("/user/create", async (req, res) => {
  const { Email, Password, UserType, Username, ProgramID } = req.body;
  let hashedPassword = await hash(Password, 10);
  const created = await prisma.users.create({
    data: {
      Email,
      Password: hashedPassword,
      UserType,
      Username,
      ProgramID,
    },
  });

  return res.redirect("/admin/dashboard");
});
app.post("/assignment/create", async (req, res) => {
  const { Title, Deadline } = req.body;
  const deadline = new Date(Deadline).toLocaleDateString();
  const created = await prisma.assignments.create({
    data: {
      Title,
      Deadline: deadline,
      isUploadedByTrainer: true,
    },
  });

  return res.redirect("/trainer/assignments");
});
app.post("/assignment/mark", async (req, res) => {
  try {
    const { Grade, assignmentID } = req.body;
    console.log("🚀 ~ app.post ~ Grade:", Grade);
    console.log("🚀 ~ app.post ~ assignmentID:", assignmentID);

    const created = await prisma.assignments.update({
      where: {
        AssignmentID: +assignmentID,
      },
      data: {
        Grade: +Grade,
      },
    });

    return res.redirect("/trainer/assignments");
  } catch (error) {
    console.log("🚀 ~ app.post ~ error:", error);
  }
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
