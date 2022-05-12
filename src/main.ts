import http from "http";
import type { ServerResponse } from "http";
import { getPostData } from "./utils/getPostData";
import { createFilePersistedTaskApi /*createRamTaskApi*/ } from "./TaskApi";
import { join as pathJoin } from "path";

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

async function main() {

	const taskApi = await createFilePersistedTaskApi({
		"filePath": pathJoin(process.cwd(), "data", "tasks.json")
	});

	/*const taskApi = createRamTaskApi({
		"initialTasks": []
	})*/

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
					const { postData } = await getPostData({ req });
					const newTask = JSON.parse(postData);
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
					const data = JSON.parse((await getPostData({ req })).postData);

					updateData: {
						if (data.hasOwnProperty("length")) {
							await taskApi.updateTasks({
								"tasks": data
							});
							break updateData;
						};

						await taskApi.updateTask({
							"task": data
						});
					};

					respond({
						res,
						"statusCode": 201,
						"chunk": data
					});
				})()
				return;

			case "DELETE":
				(async () => {
					const { postData } = await getPostData({ req });
					const parsedData = postData === "" ? -1 : JSON.parse(postData);
					respond({
						res,
						"statusCode": 200,
						"chunk": await (async () => {
							if (parsedData === -1) {
								await taskApi.deleteAllTasks();
								return "all tasks deleted";
							}

							if(parsedData.hasOwnProperty("length")){
								return await taskApi.deleteTasks({
									"ids": parsedData
								});
							};

							return await taskApi.deleteTask({
								"id": parsedData
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