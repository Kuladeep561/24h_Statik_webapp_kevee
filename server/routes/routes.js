const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  requestsMiddleware,
  requestsAssignedByMiddleware,
  getUserDetailsByRequestId,
  getKeveeFolderItemByRequestId,
  insertSharepointDetails,
  docxGenerator,
  pdfMerger,
} = require("../utils/utils");
const { XMLModifier, insertWallOpeningDataMiddleware, loadCalculationMiddleware } = require("../utils/dlt");
const {
  initializeGraphForAppOnlyAuth,
  getContent,
  createFolder,
  uploadSmallFile,
  uploadLargeFile,
  sendEmail,
  sendEmailToUser,
} = require("../services/graph");
const { convertDocxToPdf } = require("../services/adobe");
const { SHAREPOINT_SITEID, SHAREPOINT_PARENTITEM } = require("../config");
const router = express.Router();
router.use(express.json());

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let graphAuthInitialized = false;
async function ensureGraphAuthInitialized() {
  if (!graphAuthInitialized) {
    await initializeGraphForAppOnlyAuth();
    graphAuthInitialized = true;
  }
}

const uploadFiles = async (file, parentId, requestId) => {
  try {
    file.originalname = `${requestId}_${file.originalname}`;
    return file.size < 250000000 ? await uploadSmallFile(parentId, file) : await uploadLargeFile(parentId, file);
  } catch (error) {
    console.error("Failed to process file", file.originalname, error);
    throw error;
  }
};

router.post("/api/requests", requestsMiddleware, (req, res) => {
  const requestId = req.generatedRequestId;
  if (requestId) {
    res.json({ success: true, requestId });
  } else {
    res.status(500).json({ success: false, message: "Unexpected error occurred" });
  }
});

router.post("/api/upload", upload.any(), requestsAssignedByMiddleware, async (req, res) => {
  const { body, files } = req;
  const requestId = body.requestId.slice(0, -3);
  const fileFields = files.filter((file) => file.fieldname.endsWith("File"));

  try {
    if (!body) {
      return res.status(400).json({ message: "No request body found" });
    }

    if (files && files.length > 0) {
      await ensureGraphAuthInitialized();
      const parentId = await getKeveeFolderItemByRequestId(requestId);
      if (!parentId) throw new Error("Parent ID not found");

      const finalFile = await processFiles(fileFields, parentId, requestId);
      const user = await getUserDetailsByRequestId(requestId);
      await sendEmailToUser(user, finalFile);

      res.status(200).json({ message: "File uploads successful and emailed the user" });
    } else {
      res.status(500).json({ message: "No files to upload, but the request was processed successfully" });
    }
  } catch (error) {
    console.error("An unexpected error occurred", error);
    res.status(500).json({ message: "An unexpected error occurred", error: error.message });
  }
});

async function processFiles(fileFields, parentId, requestId) {
  let combinedBuffer;
  let blob;
  for (const file of fileFields) {
    const uploadResp = await uploadSmallFile(parentId, file);
    if (file.originalname.endsWith(".docx")) {
      blob = await getContent(uploadResp.id, "pdf");
    } else if (file.originalname.endsWith(".pdf")) {
      blob = await getContent(uploadResp.id);
    }
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const instructionPdfPath = path.resolve(__dirname, "../src/templates/docx/WanddurchbruecheMW-instructions.pdf");
    const instructionPdfBuffer = fs.readFileSync(instructionPdfPath);
    combinedBuffer = await pdfMerger(Buffer.from(uint8Array), instructionPdfBuffer);
  }
  return { buffer: combinedBuffer, originalname: `${requestId}_final.pdf` };
}

router.post("/api/wo", upload.any(), [insertWallOpeningDataMiddleware, loadCalculationMiddleware], async (req, res) => {
  const { body, files } = req;
  const fileFields = files.filter((file) => file.fieldname.endsWith("File"));

  try {
    if (!body.requestId || !files) {
      throw new Error("Request ID or files missing");
    }

    await ensureGraphAuthInitialized();
    const respObj = await createSharepointFolders(body, fileFields);

    if (!respObj.userFolderId) {
      throw new Error("User folder ID is not defined");
    }
    for (const file of fileFields) {
      await uploadFiles(file, respObj.userFolderId, body.requestId);
    }
    await uploadFiles(body.loadCalcDox, respObj.keveeFolderId, body.requestId);

    const friloResp = await handleFriloTemplateUpdate(body, respObj);

    const userEnteredPdfBuff = await generateUserEnteredPDF(body, respObj.userFolderId);
    const toEmail = "kuladeep.karimpati@kevee.com";
    const _requestId = `${body.requestId}_WO`;
    await sendEmail(toEmail, _requestId, friloResp.webUrl, respObj.userFolderUrl);
    delete respObj.userFolderUrl;
    delete respObj.keveeFolderUrl;
    await insertSharepointDetails(respObj);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${body.requestId}_your_submission.pdf"`);
    res.end(userEnteredPdfBuff);
  } catch (error) {
    console.error("Failed to process request", error);
    res.status(500).send({ error: "Failed to upload files", details: error.message });
  }
});

async function createSharepointFolders(body, fileFields) {
  const _requestId = `${body.requestId}_WO`;
  const parentFolderResp = await createFolder(SHAREPOINT_PARENTITEM, _requestId);
  const userFolderResp = await createFolder(parentFolderResp.id, "User Inputs");
  const keveeFolderResp = await createFolder(parentFolderResp.id, "Kevee Outputs");

  return {
    parentFolderId: parentFolderResp.id,
    userFolderId: userFolderResp.id,
    userFolderUrl: userFolderResp.webUrl,
    keveeFolderId: keveeFolderResp.id,
    keveeFolderUrl: keveeFolderResp.webUrl,
    requestId: body.requestId,
  };
}

async function handleFriloTemplateUpdate(body, respObj) {
  const xmlDltPath = path.resolve(__dirname, "../src/templates/dlt+/DLTplusSinglespanSteel.flx");
  const xmlModifier = new XMLModifier(xmlDltPath);
  await xmlModifier.initialize();
  xmlModifier.modifyLength(+body.breite + 30);
  xmlModifier.modifyLoadValues(+body.deadload / 100, +body.liveload / 100);
  const friloXmlDlt = await xmlModifier.getModifiedXMLAsBuffer();
  const resp = await uploadFiles(friloXmlDlt, respObj.keveeFolderId, body.requestId);
  return resp;
}

async function generateUserEnteredPDF(body, userFolderId) {
  const userEnteredDocx = docxGenerator("UserEnteredData", body);
  const userEnteredDataDocxResp = await uploadFiles(userEnteredDocx, userFolderId, body.requestId);
  const blob = await getContent(userEnteredDataDocxResp.id, "pdf");
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  return Buffer.from(uint8Array);
}

module.exports = router;
