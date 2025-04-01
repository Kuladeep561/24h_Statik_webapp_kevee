const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const PDFDocument = require("pdf-lib").PDFDocument;
const { poolPromise } = require("../dbconfig.js");

exports.requestsAssignedByMiddleware = async (req, res, next) => {
  try {
    let { requestId, submittedBy } = req.body;

    // Split the requestId at "_" and remove the last part
    requestId = requestId.split("_").slice(0, -1).join("_");

    const pool = await poolPromise;
    const request = pool.request();

    // Using named parameters with @ prefix for SQL Server
    const sql = `INSERT INTO requests_assigned (request_id, submitted_by) VALUES (@requestId, @submittedBy)`;
    request.input("requestId", requestId);
    request.input("submittedBy", submittedBy);

    await request.query(sql);
    next(); // Proceed to next middleware or route handler
  } catch (err) {
    const error = new Error("Database error");
    console.error("Error:", err);
    error.status = 500;
    error.details = err;
    return next(error);
  }
};

exports.requestsMiddleware = async (req, res, next) => {
  const { module, email } = req.body;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    // Insert new record with module and email
    const insertSql = `INSERT INTO requests (module, email, timestamp) OUTPUT INSERTED.request_id VALUES (@module, @email, GETDATE())`;
    request.input("module", module);
    request.input("email", email);

    const { recordset } = await request.query(insertSql);

    // Assuming only one row is inserted at a time, so we can directly access the first item
    if (recordset.length > 0) {
      req.generatedRequestId = recordset[0].request_id; // Store the generated request_id in the request object
      next(); // Proceed to next middleware or route handler
    } else {
      throw new Error("Failed to insert the request");
    }
  } catch (err) {
    const error = new Error("Database error");
    error.status = 500;
    error.details = err;
    return next(error);
  }
};

exports.getUserDetailsByRequestId = async (requestId) => {
  try {
    const pool = await poolPromise;
    let request = pool.request();

    // Query to get email by requestId
    let emailQuery = `SELECT email FROM requests WHERE request_id = @requestId`;
    request.input("requestId", requestId);
    let result = await request.query(emailQuery);

    if (result.recordset.length === 0) {
      throw new Error("No email found for the given request ID");
    }

    const email = result.recordset[0].email;

    // Query to get fullname by email
    request = pool.request(); // Resetting request for a new query
    let nameQuery = `SELECT fullname FROM users WHERE email = @email`;
    request.input("email", email);
    result = await request.query(nameQuery);

    if (result.recordset.length === 0) {
      throw new Error("No user found for the given email");
    }

    const fullname = result.recordset[0].fullname;

    // Return the user details
    return { name: fullname, email: email };
  } catch (err) {
    // Handle errors (e.g., log them, throw them, etc.)
    console.error("Error fetching user details:", err);
    throw err; // Rethrow or handle as needed
  }
};

exports.insertSharepointDetails = async (details) => {
  try {
    const pool = await poolPromise; // Assuming poolPromise is a promise that resolves with your SQL connection pool
    const request = pool.request();

    // Prepare the SQL INSERT statement
    const insertQuery = `
      INSERT INTO requests_sharepoint_details (request_id, sp_parent_item, sp_userfolder_item, sp_keveefolder_item)
      VALUES (@requestId, @parentFolderId, @userFolderId, @keveeFolderId)
    `;

    // Add parameters to prevent SQL injection
    request.input("requestId", details.requestId);
    request.input("parentFolderId", details.parentFolderId);
    request.input("userFolderId", details.userFolderId);
    request.input("keveeFolderId", details.keveeFolderId);

    // Execute the query
    await request.query(insertQuery);
  } catch (err) {
    // Handle any errors
    console.error("Error inserting data into requests_sharepoint_details:", err);
    throw err; // Rethrow or handle as needed
  }
};

exports.getKeveeFolderItemByRequestId = async (requestId) => {
  try {
    const pool = await poolPromise; // Assuming poolPromise is already defined
    const request = pool.request();

    // Prepare the SQL SELECT statement
    const selectQuery = `
      SELECT sp_keveefolder_item
      FROM requests_sharepoint_details
      WHERE request_id = @requestId
    `;

    // Add parameter to prevent SQL injection
    request.input("requestId", requestId);

    // Execute the query
    const result = await request.query(selectQuery);

    // Check if the query returned any results
    if (result.recordset.length > 0) {
      // Return the sp_keveefolder_item from the first row
      return result.recordset[0].sp_keveefolder_item;
    } else {
      // Handle the case where no matching record is found
      console.log("No record found for the given requestId:", requestId);
      return null; // Or throw an error as per your error handling strategy
    }
  } catch (err) {
    // Handle any errors
    console.error("Error querying sp_keveefolder_item by requestId:", err);
    throw err; // Rethrow or handle as needed
  }
};

exports.docxGenerator = (docxName, details) => {
  const content = fs.readFileSync(path.resolve(__dirname, `../src/templates/docx/${docxName}.docx`), "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater().loadZip(zip);
  doc.setData(details);

  try {
    // Apply the replacements
    doc.render();
  } catch (error) {
    console.error("Error occurred:", error);
  }
  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  const originalname = `${docxName}.docx`;
  const size = buffer.length;

  return {
    buffer: buffer,
    originalname: originalname,
    size: size,
  };
};

exports.executeCommand = (module, inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const exe = path.join("C:", "Program Files (x86)", "Frilo", "R-2024-1", module);
    const command = `"${exe}" /s /a "${inputPath}" /o "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

exports.pdfMerger = async (pdfBuffer1, pdfBuffer2) => {
  var pdfsToMerge = [pdfBuffer1, pdfBuffer2];

  const mergedPdf = await PDFDocument.create();
  for (const pdfBytes of pdfsToMerge) {
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }
  const uint8Array = await mergedPdf.save(); // Uint8Array
  const buffer = Buffer.from(uint8Array);
  return buffer;
};
