import type { IncomingMessage, ServerResponse } from "http";
import type { Task } from "./Task.type";
import tasksJson from "../data/tasks.json";
import { getPostData } from "./utils/getPostData";
import fs from "fs";
import path from "path";

const tasks: Task[] = JSON.parse(JSON.stringify(tasksJson));

function respond(params: {
	statusCode: number,
	res: ServerResponse
	value: String;
}){
	const {res, statusCode, value} = params;
	res.writeHead(statusCode, {
		"Content-Type": "application/json"
	});

	res.end(value);
};

function writeToFile() {
	fs.writeFileSync(
		path.join(
			__dirname,
			"..",
			"data",
			"tasks.json"
		),
		JSON.stringify(tasks)
	);
}


export async function getTasks(params: {
	id?: string;
	res: ServerResponse;
	req: IncomingMessage;
}) {
	const { req, res, id } = params;
	if (req.method !== "GET") {
		respond({
			res,
			"statusCode": 404,
			"value": "Invalid request!"
		})
		return;
	}
	if (id === undefined) {
		respond({
			res,
			"statusCode": 200,
			"value": JSON.stringify(tasks)
		})
		return;
	}

	const task = tasks.find(({ id: taskId }) => id === taskId);

	respond({
		res,
		"statusCode": task === undefined ? 404 : 200,
		"value": JSON.stringify(task ?? "invalid task id")
	});

};



export async function addTask(params: {
	res: ServerResponse;
	req: IncomingMessage;
}) {
	const { req, res } = params;
	if (req.method !== "POST") {
		respond({
			res,
			"statusCode": 404,
			"value": "invalid method!"
		});
	}

	getPostData({ req }).then(data => {
		tasks.push(JSON.parse(data));
		writeToFile();
		respond({
			res,
			"statusCode": 200,
			"value": data
		});
	});

};

export async function updateTask(params: {
	res: ServerResponse;
	req: IncomingMessage;
	id: string;
}) {
	const { req, res, id } = params;

	const taskToUpdateIndex = tasks.findIndex(task => task.id === id);

	if (req.url === "/" || req.method !== "PUT" || taskToUpdateIndex === -1) {
		respond({
			res,
			"statusCode": 404,
			"value": "invalid method or invalid id"
		});
		return;
	}

	getPostData({
		req
	}).then(data => {
		tasks[taskToUpdateIndex] = JSON.parse(data);
		writeToFile();
		respond({
			res,
			"statusCode": 200,
			"value": JSON.stringify(tasks[taskToUpdateIndex])
		})
	})

};

export async function deleteTask(
	params: {
		req: IncomingMessage;
		res: ServerResponse;
		id: string;
	}
) {
	const { id, req, res } = params;
	const taskToDeleteIndex = tasks.findIndex(task => task.id === id);

	if (req.url === "/" || req.method !== "DELETE" || taskToDeleteIndex === -1) {
		respond({
			res,
			"statusCode": 404,
			"value": "invalid method or invalid id"
		});
		return;
	};


	const deletedtask = {...tasks[taskToDeleteIndex], "status": "deleted"};

	tasks.splice(taskToDeleteIndex, 1);
	writeToFile();
	respond({
		res,
		"statusCode": 200,
		"value": JSON.stringify(deletedtask)
	})
}

export function deleteAllTasks(params: {
	req: IncomingMessage;
	res: ServerResponse;
}) {
	const { req, res } = params;
	if(req.method !== "DELETE"){
		respond({
			res,
			"statusCode": 404,
			"value": "invalid method"
		});
		return;
	};

	tasks.splice(0, tasks.length);
	writeToFile();
	respond({
		res,
		"statusCode": 200,
		"value": "all tasks deleted"
	})

}