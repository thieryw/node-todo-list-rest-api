import http from "http";
//const tasks = require("../data/tasks");
import { getTasks, addTask, updateTask, deleteTask, deleteAllTasks } from "./serverActions";

type task = {
	message: string;
	id: string;
	isCompleted: boolean;
}

const PORT = 5000;

const server = http.createServer((req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Request-Method", "*");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "*");

	
	(() => {
		switch (req.method) {
			case "GET":
				getTasks({
					req,
					res,
					"id": req.url === "/" ? undefined : req.url?.replace("/", "")
				});
				return;

			case "POST":

				addTask({
					req,
					res
				})
				return;

			case "PUT":
				updateTask({
					req,
					res,
					"id": req.url?.replace("/", "") ?? ""

				})
				return;

			case "DELETE":
				(()=>{
					if(req.url === "/"){
						deleteAllTasks({
							req,
							res
						});
						return;
					}
					deleteTask({
						res,
						req,
						"id": req.url?.replace("/", "") ?? ""
					})
				})()
		}
	})()
});

server.listen(PORT, () => { console.log(`server running on localhost:${PORT}`) });
