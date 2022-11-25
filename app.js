const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

//const bcrypt = require("bcrypt");
//const jwt = require("jsonwebtoken");

let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

convertTodoDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    due_date: dbObject.due_date,
  };
};

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT TOKEN");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT TOKEN");
      } else {
        next();
      }
    });
  }
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
          select * from todo where priority = '${priority}' and status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
          select * from todo where priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        select * from todo where status = '${status}';`;
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
        select * from todo where todo contains '${search_q}';`;
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `
        select * from todo where category = '${category}' and status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
        select * from todo where category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
        select * from todo where category = '${category}' and priority = '${priority}';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(
    data.map((eachState) => convertTodoDbObjectToResponseObject(eachState))
  );
});

module.exports = app;
