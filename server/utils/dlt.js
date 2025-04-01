const fs = require("fs").promises;
const path = require("path");
const parser = require("xml2js");
const builder = new parser.Builder();
const { poolPromise } = require("../dbconfig.js");
const { docxGenerator } = require("./utils.js");

const densityMap = {
  stahlbeton: 25,
  mauerwerk: 20,
};

const liveloadMap = {
  floor: 2.0,
  roof: 1.5,
};

function loadCalculator(t, l, density) {
  return t * l * density;
}

function calcRccFlatroof(data) {
  let { tiefe, d3, hoehe, deckentiefe, t1, t2, wandbaustoff, obergeschosse, betroffengeschoss, betroffeneWand, wandputzType } =
    data;

  //Convert from centimeters to meters
  tiefe /= 100;
  d3 /= 100;
  hoehe /= 100;
  deckentiefe /= 100;
  t1 /= 100;
  t2 /= 100;

  const wandHoehe = d3 + hoehe;
  const floorFixtures = 1.0; // 1.0 kN/m2
  const deadloadFactorForRoof = 2; // 2 kN/m2
  const defaultDensity = 25; // kN/m3 for Concrete
  const _deckentiefe = deckentiefe === 0 ? 0.22 : deckentiefe; // Minimum slab thickness
  const lowerCaseWandbaustoff = wandbaustoff.toLowerCase();
  const density = densityMap[lowerCaseWandbaustoff] || defaultDensity;
  const stories = Math.abs(obergeschosse - betroffengeschoss) || 1;
  const wandputzSelfWeight = wandputzType === "einseitig" ? 0.25 : wandputzType === "beidseitig" ? 0.5 : 0;

  let slabSelfWeight =
    loadCalculator(_deckentiefe, betroffeneWand === "Innenwand" ? (t1 + t2) / 2 : t1 / 2, density) +
    (floorFixtures * (betroffeneWand === "Innenwand" ? t1 + t2 : t1)) / 2;
  let roofSelfWeight =
    loadCalculator(_deckentiefe, betroffeneWand === "Innenwand" ? (t1 + t2) / 2 : t1 / 2, density) +
    (deadloadFactorForRoof * (betroffeneWand === "Innenwand" ? t1 + t2 : t1)) / 2;

  // load from walls
  const wallJustAbove = loadCalculator(tiefe, d3, density) + d3 * wandputzSelfWeight;
  const wallsFromAboveFloors = (loadCalculator(tiefe, wandHoehe, density) + wandHoehe * wandputzSelfWeight) * stories;
  const totalWallLoad = +(wallJustAbove + wallsFromAboveFloors).toFixed(2);

  // load from slab
  const slabsFromAboveFloors = slabSelfWeight * stories;
  const totalSlabLoad = slabsFromAboveFloors + roofSelfWeight;

  const totalDeadLoad = +(totalSlabLoad + totalWallLoad).toFixed(2);

  //liveload from floors and roof
  const totalLiveload =
    (liveloadMap.floor * stories + liveloadMap.roof) * (betroffeneWand === "Innenwand" ? (t1 + t2) / 2 : t1 / 2);

  return {
    totalDeadLoad,
    additionalData: {
      tiefe,
      d3,
      hoehe,
      wandHoehe,
      _deckentiefe,
      t1,
      t2,
      density,
      stories,
      totalWallLoad,
      slabsFromAboveFloors,
      roofSelfWeight,
    },
    totalLiveload,
  };
}

function calcClasssicRoof(data) {
  return null;
}

// Function to read and modify XML file
class XMLModifier {
  constructor(xmlPath) {
    this.xmlPath = xmlPath;
    this.xmldata = null;
    this.originalname = path.basename(xmlPath);
    this.result = null;
  }

  async initialize() {
    this.xmldata = await fs.readFile(this.xmlPath, "utf-8");
    await this.parseXML();
  }

  async parseXML() {
    this.result = await parser.parseStringPromise(this.xmldata);
  }

  modifyLength(newLength) {
    if (
      this.result &&
      this.result.Root &&
      this.result.Root.System[0] &&
      this.result.Root.System[0].Felder[0] &&
      this.result.Root.System[0].Felder[0].Feld[0] &&
      this.result.Root.System[0].Felder[0].Feld[0].Laenge
    ) {
      this.result.Root.System[0].Felder[0].Feld[0].Laenge[0] = newLength;
    } else {
      console.log("One of the properties is undefined");
    }
  }

  modifyLoadValues(deadLoad, liveLoad) {
    if (
      this.result &&
      this.result.Root &&
      this.result.Root.Belastung &&
      this.result.Root.Belastung[0] &&
      this.result.Root.Belastung[0].Zusatzlasten &&
      this.result.Root.Belastung[0].Zusatzlasten[0] &&
      this.result.Root.Belastung[0].Zusatzlasten[0].Last
    ) {
      const lasts = this.result.Root.Belastung[0].Zusatzlasten[0].Last;
      if (lasts[0] && lasts[0].W1 && lasts[0].W2) {
        lasts[0].W1[0] = deadLoad;
        lasts[0].W2[0] = deadLoad;
      }
      if (lasts[1] && lasts[1].W1 && lasts[1].W2) {
        lasts[1].W1[0] = liveLoad;
        lasts[1].W2[0] = liveLoad;
      }
    } else {
      console.log("One of the properties is undefined");
    }
  }

  async getModifiedXMLAsBuffer() {
    const xmlString = builder.buildObject(this.result);
    const buffer = Buffer.from(xmlString, "utf-8");
    return {
      buffer: buffer,
      originalname: this.originalname,
      size: buffer.length,
    };
  }
}

async function insertWallOpeningDataMiddleware(req, res, next) {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    const data = req.body;
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map((key) => `@${key}`)
      .join(", ");

    // Include OUTPUT INSERTED.id to capture the inserted ID
    const sql = `INSERT INTO wo_inputdata (${columns}) OUTPUT INSERTED.requestId VALUES (${placeholders})`;
    Object.keys(data).forEach((key) => {
      request.input(key, data[key]);
    });

    const result = await request.query(sql);

    const insertedId = result.recordset[0].requestId;
    req.body.requestId = insertedId; // Add the inserted ID to the request body
    console.log(`A row has been inserted with rowid ${insertedId}`);
    next();
  } catch (err) {
    console.log("sql error:", err);
    const error = new Error("Database error");
    error.status = 500;
    error.details = err;
    next(error); // Pass error to the error handling middleware
  }
}

// Middleware for deadload calculation
async function loadCalculationMiddleware(req, res, next) {
  const data = req.body;
  const roofType = data.dachkonstruktion.replace(/-/g, "").toLowerCase();
  console.log("Load calculation started");
  try {
    let calculationResult = null;
    if (roofType === "stahlbetonflachdach") {
      calculationResult = calcRccFlatroof(data);
      const details = {
        ...calculationResult.additionalData,
        totalDeadLoad: calculationResult.totalDeadLoad,
        totalLiveload: calculationResult.totalLiveload,
      };
      const loadCalcDox = docxGenerator("LoadCalculation", details);
      req.body.loadCalcDox = loadCalcDox;
    } else if (roofType === "classicdach") {
      calculationResult = calcClasssicRoof(data);
    } else {
      console.warn("Unrecognized roof type. Proceeding without load calculation.");
      next();
      return;
    }

    req.body.deadload = calculationResult.totalDeadLoad;
    req.body.liveload = calculationResult.totalLiveload;

    next();
  } catch (err) {
    console.log("Error in deadloadCalculationMiddleware", err);
    const error = new Error("Error in deadloadCalculationMiddleware");
    error.status = 500;
    error.details = err;
    next(error); // Pass error to the error handling middleware
  }
}

async function multispanToSinlglespanFrilo(filePath, newPath) {
  const parser = new xml2js.Parser();
  const builder = new xml2js.Builder();

  const data = fs.readFileSync(filePath);
  const result = await parser.parseStringPromise(data);

  // Remove second 'Feld' from 'Felder'
  if (result.Root && result.Root.System && result.Root.System[0].Felder) {
    result.Root.System[0].Felder[0].Feld.splice(1, 1);
  }

  // Remove first 'Auflager' from 'Auflagerliste'
  if (result.Root && result.Root.System && result.Root.System[0].Auflagerliste) {
    result.Root.System[0].Auflagerliste[0].Auflager.shift();
  }

  // Remove all 'Bezeichnung' except first and last from 'Querschnittsbezeichnungen'
  if (result.Root && result.Root.Konfiguration && result.Root.Konfiguration[0].Querschnittsbezeichnungen) {
    const bezeichnungen = result.Root.Konfiguration[0].Querschnittsbezeichnungen[0].Bezeichnung;
    result.Root.Konfiguration[0].Querschnittsbezeichnungen[0].Bezeichnung = [
      bezeichnungen[0],
      bezeichnungen[bezeichnungen.length - 1],
    ];
  }

  const xml = builder.buildObject(result);
  fs.writeFileSync(newPath, xml);
}

module.exports = {
  XMLModifier,
  insertWallOpeningDataMiddleware,
  loadCalculationMiddleware,
};
