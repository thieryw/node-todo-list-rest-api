import http from "http";
//const tasks = require("../data/tasks");
import { getTasks, addTask, updateTask, deleteTask, deleteAllTasks } from "./taskActions";
import { getPostData } from "./utils/getPostData";

const PORT = 80;

const server = http.createServer((req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Request-Method", "*");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "*");

	switch (req.method) {
		case "OPTIONS": res.end(); return;
		case "GET":
			(async () => {
				const tasks = await getTasks({
					"id": req.url === "/" ? undefined : req.url?.replace(/^\//, "")
				});

				res.writeHead(200, {
					"Content-Type": "application/json"
				})

				res.end(JSON.stringify(tasks))
			})()
			return;

		case "POST":
			(async () => {
				res.writeHead(201, {
					"Content-Type": "application/json"
				});
				const newTask = await getPostData({req});
				await addTask(JSON.parse(newTask));
				res.end(newTask);
			})()

			return;

		case "PUT":
			(async () => {
				res.writeHead(req.url === "/" ? 404 : 201, {
					"Content-Type": "application/json"
				});
				if(req.url === "/"){
					res.end("Invalid url!")
				}
				const updatedTask = JSON.parse((await getPostData({req})));
				await updateTask({
					"id": req.url?.replace(/^\//,"") ?? "",
					updatedTask,
				})

				res.end(JSON.stringify(updatedTask));
			})()
			return;

		case "DELETE":
			(async ()=> {
				res.writeHead(200, {
					"Content-Type": "application/json"
				})

				if(req.url === "/"){
					await deleteAllTasks();
					res.end("all tasks deleted");
					return;
				}

				const deletedTask = await deleteTask({
					"id": req.url?.replace(/^\//, "") ?? ""
				});

				res.end(JSON.stringify(deletedTask));
			})()
	}
});

server.listen(PORT, () => { console.log(`server running on localhost:${PORT}`) });
