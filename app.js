const express = require("express");

const app = express();
app.use(express.json());

const dateTime = require("date-fns");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (Error) {
    console.log(`DB Error ${Error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//convertDbObject To ServerObject\
const convertDbObjectToServerObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

// Get todos API

app.get("/todos/", async (request, response) => {
  const { category, priority, status, due_date, search_q = "" } = request.query;

  let getTodosQuery;
  let getTodosDetails;
  switch (true) {
    case priority !== undefined && status !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}' AND status='${status}';`;
          getTodosDetails = await db.all(getTodosQuery);
          response.send(
            getTodosDetails.map((eachObject) =>
              convertDbObjectToServerObject(eachObject)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case category !== undefined && status !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`;
          getTodosDetails = await db.all(getTodosQuery);
          response.send(
            getTodosDetails.map((eachObject) =>
              convertDbObjectToServerObject(eachObject)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case category !== undefined && priority !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
          getTodosDetails = await db.all(getTodosQuery);
          response.send(
            getTodosDetails.map((eachObject) =>
              convertDbObjectToServerObject(eachObject)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
        getTodosDetails = await db.all(getTodosQuery);
        response.send(
          getTodosDetails.map((eachObject) =>
            convertDbObjectToServerObject(eachObject)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status='${status}';`;
        getTodosDetails = await db.all(getTodosQuery);
        response.send(
          getTodosDetails.map((eachObject) =>
            convertDbObjectToServerObject(eachObject)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}';`;
        getTodosDetails = await db.all(getTodosQuery);
        response.send(
          getTodosDetails.map((eachObject) =>
            convertDbObjectToServerObject(eachObject)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case search_q !== undefined:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      getTodosDetails = await db.all(getTodosQuery);
      response.send(
        getTodosDetails.map((eachObject) =>
          convertDbObjectToServerObject(eachObject)
        )
      );
      break;
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      getTodosDetails = await db.all(getTodosQuery);
      response.send(
        getTodosDetails.map((eachObject) =>
          convertDbObjectToServerObject(eachObject)
        )
      );
  }
});

//Get Specific todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id=${todoId};
  `;
  const getTodoDetails = await db.get(getTodoQuery);
  response.send(convertDbObjectToServerObject(getTodoDetails));
});

//Agenda todo API
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const agendaNewDate = format(new Date(date), "yyyy-MM-dd");
    //   console.log(newDate);
    const selectAgendaQuery = `SELECT * FROM todo WHERE due_date='${agendaNewDate}';`;
    const getAgendaDetails = await db.all(selectAgendaQuery);
    console.log(getAgendaDetails);
    response.send(
      getAgendaDetails.map((eachObject) =>
        convertDbObjectToServerObject(eachObject)
      )
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Create todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodosQuery = `
                            INSERT INTO todo (id, todo, category, priority, status, due_date )
                            VALUES (
                                ${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDate}'
                            );
                        `;
          const addTodoDetails = await db.run(addTodosQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//Update todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let addTodoQuery;
  switch (true) {
    case todo !== undefined:
      if (todo !== undefined) {
        addTodoQuery = `
                UPDATE todo
                SET 
                    todo='${todo}'
                WHERE id=${todoId}
                ;
            `;
        await db.run(addTodoQuery);
        response.send("Todo Updated");
      }
      break;
    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        addTodoQuery = `
                UPDATE todo
                SET 
                    priority='${priority}'
                ;
            `;
        await db.run(addTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        addTodoQuery = `
            UPDATE todo
            SET
                status='${status}'
            WHERE id=${todoId}
            ;
        `;
        await db.run(addTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        addTodoQuery = `
            UPDATE todo
            SET 
                category='${category}'
            WHERE id=${todoId}
            ;
        `;
        await db.run(addTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        addTodoQuery = `
            UPDATE todo
            SET 
                due_date='${newDate}'
            WHERE id=${todoId}
            ;
        `;
        await db.run(addTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//Delete todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.get(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
