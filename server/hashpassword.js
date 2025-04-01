const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/users.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the users database.");
  }
});

db.all(`SELECT * FROM users`, [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    const passwordHash = bcrypt.hashSync(row.password, 10);
    db.run(
      `UPDATE users SET password = ? WHERE email = ?`,
      [passwordHash, row.email],
      function (err) {
        if (err) {
          console.error(err.message);
        } else {
          console.log(`Updated password for user ${row.email}`);
        }
      }
    );
  });
});
