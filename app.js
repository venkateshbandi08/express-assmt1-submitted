const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;

const { format, compareAsc, isValid } = require("date-fns");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API - 1;

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearch_q = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertSnakeToCamel = (requestObject) => {
  return {
    id: requestObject.id,
    todo: requestObject.todo,
    priority: requestObject.priority,
    status: requestObject.status,
    category: requestObject.category,
    dueDate: requestObject.due_date,
  };
};

const validStatusValues = (requestObject) => {
  if (
    requestObject.status === "TO DO" ||
    requestObject.status === "IN PROGRESS" ||
    requestObject.status === "DONE"
  ) {
    return true;
  }
  return false;
};

const isValidStatus = (keyParameter) => {
  if (
    keyParameter === "TO DO" ||
    keyParameter === "IN PROGRESS" ||
    keyParameter === "DONE"
  ) {
    return true;
  } else {
    return false;
  }
};

const isValidPriority = (keyParameter) => {
  if (
    keyParameter === "HIGH" ||
    keyParameter === "LOW" ||
    keyParameter === "MEDIUM"
  ) {
    return true;
  } else {
    return false;
  }
};

const isValidCategory = (keyParameter) => {
  if (
    keyParameter === "WORK" ||
    keyParameter === "HOME" ||
    keyParameter === "LEARNING"
  ) {
    return true;
  } else {
    return false;
  }
};

app.get("/todos/", async (request, response) => {
  const { status, priority, category, due_date, search_q = "" } = request.query;
  let getTodosQuery = "";
  let data = null;
  switch (true) {
    case hasStatus(request.query):
      if (isValidStatus(status)) {
        getTodosQuery = `
            SELECT * FROM todo
            WHERE status = '${status}';
        `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (isValidPriority(priority)) {
        getTodosQuery = `
            SELECT * FROM todo
            WHERE priority = '${priority}';
        `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndStatus(request.query):
      if (isValidPriority(priority) && isValidStatus(status)) {
        getTodosQuery = `
                    SELECT * FROM todo
                    WHERE priority = '${priority}' AND
                    status = '${status}';
                `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      } else {
        if (isValidPriority(priority) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        if (isValidStatus === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }
      break;
    case hasSearch_q(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%';
        `;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      break;
    case hasCategoryAndStatus(request.query):
      if (isValidCategory(category) && isValidStatus(status)) {
        getTodosQuery = `
                    SELECT * FROM todo
                    WHERE category = '${category}' AND
                    status = '${status}';
                `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      } else {
        if (isValidCategory(category) === false) {
          response.status(400);
          response.status("Invalid Todo Category");
        }
        if (isValidStatus(status) === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }
      break;
    case hasCategory(request.query):
      if (isValidCategory(category)) {
        getTodosQuery = `
            SELECT * FROM todo
            WHERE category = '${category}';
        `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (isValidCategory(category) && isValidStatus(status)) {
        getTodosQuery = `
            SELECT * FROM todo
            WHERE category = '${category}' AND priority = '${priority}';
        `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      } else {
        if (isValidCategory(category) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        if (isValidPriority(priority) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%';
        `;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachData) => convertSnakeToCamel(eachData)));
      break;
  }
});

// API - 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
        SELECT * FROM todo
        WHERE id = ${todoId};
    `;
  const eachTodoArray = await db.get(getTodoIdQuery);
  response.send(convertSnakeToCamel(eachTodoArray));
});

// Formatting dates

// API - 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const isDateValid = isValid(new Date(date));
    if (isDateValid) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const getQuery = `
            SELECT id, todo, priority, status, category, due_date AS dueDate
            FROM todo
            WHERE due_date = '${formattedDate}'
        `;
      const todos = await db.all(getQuery);
      response.send(todos);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

// API - 4
const isValidDate = (dueDate) => {
  const theDate = isValid(new Date(dueDate));
  if (theDate) {
    return true;
  }
  return false;
};
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if ((category !== undefined && isValidCategory(category)) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if ((priority !== undefined && isValidPriority(priority)) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if ((status !== undefined && isValidStatus(status)) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if ((dueDate !== undefined && isValid(new Date(dueDate))) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
    const postTodoQuery = `
        INSERT INTO todo (id, todo, category, priority, status, due_date)
        VALUES (
            ${id},
            '${todo}',
            '${category}',
            '${priority}',
            '${status}',
            '${formattedDate}'
        );
    `;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  }
});

// API - 5

const hasStatusInBody = (requestBody) => {
  return requestBody.status !== undefined;
};

const hasPriorityInBody = (requestBody) => {
  return requestBody.priority !== undefined;
};

const hasTodoInBody = (requestBody) => {
  return requestBody.todo !== undefined;
};

const hasCategoryInBody = (requestBody) => {
  return requestBody.category !== undefined;
};

const hasDueDateInBody = (requestBody) => {
  return requestBody.dueDate !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, category, dueDate, todo } = request.body;
  let putTodoQuery = "";
  let data = null;

  switch (true) {
    case hasStatusInBody(request.body):
      if (isValidStatus(status)) {
        putTodoQuery = `
            UPDATE todo
            SET
            status = '${status}'
            WHERE id = ${todoId};
        `;
        data = "Status Updated";
        await db.run(putTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityInBody(request.body):
      if (isValidPriority(priority)) {
        putTodoQuery = `
            UPDATE todo
            SET
            priority = '${priority}'
            WHERE id = ${todoId};
        `;
        data = "Priority Updated";
        await db.run(putTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasTodoInBody(request.body):
      putTodoQuery = `
            UPDATE todo
            SET
            todo = '${todo}'
            WHERE id = ${todoId};
        `;
      data = "Todo Updated";
      await db.run(putTodoQuery);
      response.send(data);
      break;
    case hasCategoryInBody(request.body):
      if (isValidCategory(category)) {
        putTodoQuery = `
            UPDATE todo
            SET 
            category = '${category}'
            WHERE id = ${todoId};
        `;
        data = "Category Updated";
        await db.run(putTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasDueDateInBody(request.body):
      if (dueDate === undefined) {
        response.status(400);
        response.send("Invalid Due Date");
      } else {
        const isDateValid = isValid(new Date(dueDate));
        if (isDateValid) {
          const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
          putTodoQuery = `
                        UPDATE todo
                        SET
                        due_date = '${formattedDate}'
                        WHERE id = ${todoId};
                    `;
          data = "Due Date Updated";
          await db.run(putTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      }
      break;
  }
});

// API - 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
