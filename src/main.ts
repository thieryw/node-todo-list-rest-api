import http from "http";
import type { ServerResponse } from "http";
//const tasks = require("../data/tasks");
import { getPostData } from "./utils/getPostData";
import { /*createFilePersistedTaskApi*/ createRamTaskApi } from "./TaskApi";
//import { join as pathJoin } from "path";

const port = 80;

function respond(params: {
	res: ServerResponse;
	statusCode: number;
	chunk: any;
}) {
	const { chunk, res, statusCode } = params;
	res.writeHead(statusCode, {
		"Content-Type": "application/json"
	});
	res.end(JSON.stringify(chunk));
}

function main() {

	/*const taskApi = createFilePersistedTaskApi({
		"filePath": pathJoin(process.cwd(), "data", "tasks.json")
	});*/
	const taskApi = createRamTaskApi({
		"initialTasks": []
	})

	http.createServer((req, res) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Request-Method", "*");
		res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
		res.setHeader("Access-Control-Allow-Headers", "*");

		switch (req.method) {
			case "OPTIONS": res.end(); return;
			case "GET":
				(async () => {

					const id = req.url === "/" ? undefined : req.url?.replace(/^\//, "");

					respond({
						res,
						"statusCode": 200,
						"chunk":
							id === undefined ? await taskApi.getTasks() :
								await taskApi.getTask({
									"id": parseInt(id, 10)
								})
					});

				})()
				return;

			case "POST":
				(async () => {
					const newTask = JSON.parse(await getPostData({ req }));
					taskApi.addTask(newTask)
					respond({
						res,
						"statusCode": 201,
						"chunk": newTask
					})
				})()

				return;

			case "PUT":
				(async () => {
					const updatedTask = JSON.parse((await getPostData({ req })));
					await taskApi.updateTask({
						"task": updatedTask
					});
					respond({
						res,
						"statusCode": 201,
						"chunk": updatedTask
					});
				})()
				return;

			case "DELETE":
				(async () => {
					respond({
						res,
						"statusCode": 200,
						"chunk": await (async () => {
							if (req.url === "/" || req.url === undefined) {
								await taskApi.deleteAllTasks();
								return "all tasks deleted";
							}

							return await taskApi.deleteTask({
								"id": parseInt(req.url.replace(/^\//, ""), 10)
							})
						})()
					});
				})()
		}
	}).listen(port, () => console.log(`server running on localhost:${port}`));

}

if (require.main === module) {
	main();
}