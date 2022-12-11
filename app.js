const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const { isValid, format } = require("date-fns");
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
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
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
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasTodoProperty = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const categoryArray = ["WORK", "HOME", "LEARNING"];
// first api
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
          select * from todo where priority = '${priority}' and status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      if (priorityArray.includes(priority)) {
        getTodosQuery = `
          select * from todo where priority = '${priority}';`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        break;
      }

    case hasStatusProperty(request.query):
      if (statusArray.includes(status)) {
        getTodosQuery = `
        select * from todo where status = '${status}';`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        break;
      }

    case hasCategoryProperty(request.query):
      if (categoryArray.includes(category)) {
        getTodosQuery = `
        select * from todo where category = '${category}';`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
        break;
      }

    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
        select * from todo where category = '${category}' and priority = '${priority}';`;
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
        select * from todo where todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(
    data.map((eachState) => convertTodoDbObjectToResponseObject(eachState))
  );
});

// second api
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getQuery = `
  select * from todo where id = ${todoId};`;

  const data = await db.get(getQuery);
  response.send(convertTodoDbObjectToResponseObject(data));
});

// third api
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  try {
    const dueDate = format(new Date(date), "yyyy-MM-dd");
    const getTodosQuery = `select * from todo where due_date = '${dueDate}';`;

    const todosList = await db.all(getTodosQuery);
    const newTodoList = snakeToCamel(todosList);
    response.send(newTodoList);
  } catch (error) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// fourth api

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const isDateValid = isValid(new Date(dueDate));
  if (!isDateValid) {
    response.status(400);
    response.send("Invalid Due Date");
  }
  if (!statusArray.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (!priorityArray.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (!categoryArray.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (
    statusArray.includes(status) &&
    priorityArray.includes(priority) &&
    categoryArray.includes(category)
  ) {
    const addTodosQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}','${dueDate}');`;

    await db.run(addTodosQuery);
    response.send("Todo Successfully Added");
  }
});

// fifth api

app.put("/todos/:todoId/", async (request, response) => {
  let putData = null;
  let putTodosQuery = "";
  const { todoId } = request.params;
  const { status, todo, priority, category, dueDate } = request.body;

  switch (true) {
    case status !== undefined:
      if (statusArray.includes(status)) {
        putTodosQuery = `
        update todo set status = '${status}' where id = ${todoId};`;
        putData = await db.run(putTodosQuery);
        response.send("Status Updated");
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        break;
      }

    case todo !== undefined:
      if (todo !== "") {
        putTodosQuery = `
            update todo set todo = '${todo}' where id = ${todoId};`;
        putData = await db.run(putTodosQuery);
        response.send("Todo Updated");
        break;
      }

    case priority !== undefined:
      if (priorityArray.includes(priority)) {
        putTodosQuery = `
            update todo set priority = '${priority}' where id = ${todoId};`;
        putData = await db.run(putTodosQuery);
        response.send("Priority Updated");
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        break;
      }

    case category !== undefined:
      if (categoryArray.includes(category)) {
        putTodosQuery = `
            update todo set priority = '${priority}' where id = ${todoId};`;
        putData = await db.run(putTodosQuery);
        response.send("Category Updated");
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
        break;
      }

    case dueDate !== undefined:
      const isDateValid = isValid(new Date(dueDate));
      if (isDateValid) {
        putTodosQuery = `
            update todo set due_date = '${dueDate}' where id = ${todoId};`;
        putData = await db.run(putTodosQuery);
        response.send("Due Date Updated");
        break;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        break;
      }
  }
});

// delete api

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `
    delete from todo where id = ${todoId};`;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;

