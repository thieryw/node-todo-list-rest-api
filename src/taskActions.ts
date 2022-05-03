import type { Task } from "./Task.type";
import tasksJson from "../data/tasks.json";
import fs from "fs";
import path from "path";
import { assert } from "tsafe/assert";

const tasks: Task[] = tasksJson as unknown as Task[];


async function writeToFile() {
	fs.writeFile(path.join(__dirname, "..", "data", "tasks.json"), JSON.stringify(tasks), err => {
		if (err !== null) {
			console.log(err)
		}
	})
}


export async function getTasks(params: {
	id?: string;
}): Promise<Task | Task[]> {
	const { id } = params;

	if (id === undefined) {
		return tasks;
	}
	const task = tasks.find(task => task.id === id);
	assert(task !== undefined);
	return task;
};



export async function addTask(task: Task) {
	tasks.push(task);
	await writeToFile();
};

export async function updateTask(params: {
	id: string;
	updatedTask: Task;
}) {

	const {id, updatedTask} = params;
	const indexOfTaskToUpdate = tasks.findIndex(task => task.id === id);
	assert(indexOfTaskToUpdate > -1);
	tasks[indexOfTaskToUpdate] = updatedTask;
	await writeToFile();

};

export async function deleteTask(params: {
		id: string;
}) {
	const { id } = params;
	const taskToDeleteIndex = tasks.findIndex(task => task.id);
	const taskToDelete = tasks[taskToDeleteIndex];
	assert(taskToDeleteIndex > -1);
	tasks.splice(taskToDeleteIndex, 1);
	await writeToFile();
	return taskToDelete;
}

export async function deleteAllTasks() {
	tasks.splice(0, tasks.length);
	await writeToFile();
}