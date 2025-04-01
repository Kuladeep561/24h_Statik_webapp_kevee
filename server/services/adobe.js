const { ADOBE_CLIENTID, ADOBE_CLIENTSECRET } = require("../config");
const {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  CreatePDFJob,
  CreatePDFResult,
} = require("@adobe/pdfservices-node-sdk");
const stream = require("stream");
const fs = require("fs");
const path = require("path");
const streamifier = require("streamifier");

// Function to convert DOCX to PDF and return as a buffer
async function convertDocxToPdf({ _docxFilePath = undefined, _memoryFile = undefined } = {}) {
  let readStream = null;
  let originalname = null;
  try {
    if (_docxFilePath) {
      const absoluteDocxPath = path.resolve(__dirname, _docxFilePath);
      readStream = fs.createReadStream(absoluteDocxPath);
      originalname = path.basename(_docxFilePath, path.extname(_docxFilePath)) + ".pdf";
    } else if (_memoryFile) {
      readStream = streamifier.createReadStream(_memoryFile.buffer);
      originalname = _memoryFile.originalname.replace(".docx", ".pdf");
    }

    const credentials = new ServicePrincipalCredentials({
      clientId: ADOBE_CLIENTID,
      clientSecret: ADOBE_CLIENTSECRET,
    });

    const pdfServices = new PDFServices({ credentials });
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.DOCX,
    });

    const job = new CreatePDFJob({ inputAsset });
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: CreatePDFResult,
    });

    const resultAsset = pdfServicesResponse.result.asset;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    // Create a PassThrough stream to duplicate the readStream
    const passThrough1 = new stream.PassThrough();
    const passThrough2 = new stream.PassThrough();
    streamAsset.readStream.pipe(passThrough1);
    streamAsset.readStream.pipe(passThrough2);

    // Convert one of the PassThrough streams to buffer
    const buffer = await streamToBuffer(passThrough1);

    return {
      readStream: passThrough2,
      buffer: buffer,
      originalname: originalname,
      size: buffer.length,
    };
  } catch (err) {
    console.error("Error converting DOCX to PDF", err);
    throw err; // Rethrow or handle as needed
  }
}

// Helper function to convert a stream to a buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

module.exports = { convertDocxToPdf };
