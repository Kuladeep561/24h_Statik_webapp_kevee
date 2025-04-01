const sql = require("mssql");
require("dotenv").config();
let { DBNAME, DBUSER, DBPASSWORD, DBHOST } = process.env;

if (!DBNAME || !DBUSER || !DBPASSWORD || !DBHOST) {
  console.warn("Missing some of the database environment variables.");
  process.exit(1);
}

const dbConfig = {
  user: DBUSER,
  password: DBPASSWORD,
  server: DBHOST, // e.g., 'localhost' or an IP address
  database: DBNAME,
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    trustServerCertificate: true, // Use this if you're on a local dev environment
  },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch((err) => console.log("Database Connection Failed! Bad Config: ", err));

module.exports = { sql, poolPromise };
