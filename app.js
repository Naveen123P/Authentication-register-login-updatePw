const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
module.exports = app;
app.use(express.json());
let db = null;

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initilizeDbAndServer();

// API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = bcrypt.hash(password, 10);
  const getUserDetails = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserDetails);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO
                user (username, name, password, gender, location)
            VALUES
                (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'  
                );`;
      const userAddedTable = await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuary = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserQuary);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatch);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuary = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserQuary);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    console.log(isPasswordMatch);
    if (isPasswordMatch === true) {
      if (newPassword.length > 5) {
        const hashedPassword = bcrypt.hash(newPassword, 10);
        const updatePasswordQuary = `
        UPDATE 
            user
        SET 
            password = '${hashedPassword}'
        WHERE 
            username = '${username}'
        `;
        const updatedPassword = await db.run(updatePasswordQuary);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
