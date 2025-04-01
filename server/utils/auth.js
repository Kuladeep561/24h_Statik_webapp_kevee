// controllers/usersController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { poolPromise } = require("../dbconfig.js");

exports.userRegisterMiddleware = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("email", req.body.email);

    // Check if email already exists
    const userExists = await request.query(`SELECT * FROM users WHERE email = @email`);
    if (userExists.recordset.length > 0) {
      return res.status(400).send({ error: "Email already exists" });
    } else {
      const passwordHash = bcrypt.hashSync(req.body.password, 10);
      // Insert user
      request.input("fullname", req.body.fullname);
      request.input("password", passwordHash);
      const insertUserResult = await request.query(
        `INSERT INTO users (fullname, email, password) OUTPUT INSERTED.userid VALUES (@fullname, @email, @password)`
      );
      const userid = insertUserResult.recordset[0].userid;

      // Insert address
      request.input("streetName", req.body.streetName);
      request.input("houseNumber", req.body.houseNumber);
      request.input("zipCode", req.body.zipCode);
      request.input("city", req.body.city);
      request.input("country", req.body.country);
      request.input("phoneNumber", req.body.phoneNumber);
      request.input("userid", userid);
      await request.query(
        `INSERT INTO address (street, house_number, ZIP_code, City, Country, phone_number, userid) VALUES (@streetName, @houseNumber, @zipCode, @city, @country, @phoneNumber, @userid)`
      );

      const token = jwt.sign({ id: userid }, config.JWT_KEY, {
        expiresIn: 86400, // expires in 24 hours
      });
      // Attach token and user info to request for further processing
      req.token = token;
      req.user = {
        id: userid,
        email: req.body.email,
        fullname: req.body.fullname,
      };
      next(); // Proceed to next middleware or route handler
    }
  } catch (err) {
    console.error("Database error during registration:", err);
    return res.status(500).send({ error: "Database error during registration", details: err });
  }
};

exports.loginMiddleware = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input("email", req.body.email);

    const result = await request.query(`SELECT * FROM users WHERE email = @email`);
    const row = result.recordset[0];

    if (!row) {
      console.log("No user found.");
      return res.status(404).send("No user found.");
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, row.password);
    if (!passwordIsValid) {
      console.log("Invalid password.");
      return res.status(401).send({ auth: false, token: null });
    }

    const token = jwt.sign({ id: row.userid }, config.JWT_KEY, {
      expiresIn: 86400, // expires in 24 hours
    });

    // Attach token to request so it can be used by subsequent middlewares
    req.token = token;
    req.user = { id: row.userid, email: row.email }; // Attach user info to request
    next(); // Pass control to the next middleware
  } catch (err) {
    console.error("Database error during login", err);
    return res.status(500).send({ error: "Database error during login", details: err.message });
  }
};
