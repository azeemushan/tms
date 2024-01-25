import { Router } from "express";
import fs from "fs";
import { join } from "path";
import prisma from "../lib/db.js";

const router = Router();

const uploadsDirectory = join(process.cwd(), "public", "uploads");

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory);
}

// POST endpoint for file upload
router.post("/upload", async (req, res) => {
  const { ParticipantID, Title } = req.body;

  if (!ParticipantID) {
    return res
      .status(400)
      .json({ error: "Missing properties in request body" });
  }

  const session = await prisma.trainingsessions.findFirst({
    where: {
      DeliverablesStatus: "active",
    },
  });

  const SessionID = session.SessionID;

  // Get the file from the request
  const file = req.files.file;

  if (!file) {
    return res.status(400).json({ error: "No file provided in the request" });
  }

  try {
    // Create the program-specific directory if it doesn't exist
    const sessionDirectory = join(uploadsDirectory, `${SessionID}`);
    const userDirectory = join(sessionDirectory, `${ParticipantID}`);

    if (!fs.existsSync(uploadsDirectory)) {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
    }

    // Create session directory if it doesn't exist
    if (!fs.existsSync(sessionDirectory)) {
      fs.mkdirSync(sessionDirectory, { recursive: true });
    }

    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    const FilePath = join(userDirectory, file.name);
    file.mv(FilePath);
    const path = FilePath.split(process.cwd())[1].replace("\\public", "");

    const data = await prisma.assignments.create({
      data: {
        FilePath: path,
        ParticipantID: +ParticipantID,
        SessionID: +SessionID,
        Title,
      },
    });

    res.json({ redirectTo: "/student/dashboard" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/upload/documents", async (req, res) => {
  const { ParticipantID } = req.body;

  if (!ParticipantID) {
    return res
      .status(400)
      .json({ error: "Missing properties in request body" });
  }

  const session = await prisma.trainingsessions.findFirst({
    where: {
      DeliverablesStatus: "active",
    },
  });

  const SessionID = session?.SessionID;

  // Get the file from the request
  const files = req.files;

  if (!files) {
    return res.status(400).json({ error: "No file provided in the request" });
  }

  try {
    // Create the program-specific directory if it doesn't exist
    const sessionDirectory = join(uploadsDirectory, `${SessionID}`);
    const userDirectory = join(sessionDirectory, `${ParticipantID}`);

    if (!fs.existsSync(uploadsDirectory)) {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
    }

    // Create session directory if it doesn't exist
    if (!fs.existsSync(sessionDirectory)) {
      fs.mkdirSync(sessionDirectory, { recursive: true });
    }

    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    const keys = Object.keys(files);
    let allFiles = [];
    for (let i = 0; i < keys.length; i++) {
      let value = files[`${keys[i]}`];
      allFiles.push(value);
    }
    for (let i = 0; i < allFiles.length; i++) {
      let file = allFiles[i];
      const FilePath = join(userDirectory, file.name);
      file.mv(FilePath);
      const path = FilePath.split(process.cwd())[1].replace("\\public", "");

      const data = await prisma.documents.create({
        data: {
          FilePath: path,
          UserID: +ParticipantID,
          SessionID: +SessionID,
          DocumentType: file.mimetype,
        },
      });
    }

    res.json({ redirectTo: "/student/dashboard" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
