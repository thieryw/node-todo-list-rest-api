import fs from "fs";
import { assert } from "tsafe/assert";
import * as runExclusive from "run-exclusive";
import { Deferred } from "evt/tools/Deferred";

export type Task = {
	id: number;
	message: string;
	isCompleted: boolean;
	isSelected: boolean;
};

export type TaskApi = {
	getTasks: () => Promise<Task[]>;
	getTask: (params: { id: number; }) => Promise<Task>;
	addTask: (params: Omit<Task, "id">) => Promise<{ id: number; }>;
	updateTask: (params: { task: Task; }) => Promise<void>;
	updateTasks: (params: {tasks: Task[]; }) => Promise<void>;
	deleteTask: (params: { id: number; }) => Promise<Task>;
	deleteTasks: (params: {ids: number[]}) => Promise<void>;
	deleteAllTasks: () => Promise<void>;
};


export type DataMutationFunction<T> =
	(params: {
		performMutation: (data: T) => Promise<void>
	}) => Promise<void>



function createTaskApi(
	params: {
		tasksMutation: DataMutationFunction<Task[]>;
	}
): TaskApi {

	const { tasksMutation } = params;

	return {
		"getTasks": async () => {

			const dTasks = new Deferred<Task[]>();

			await tasksMutation({
				"performMutation": tasks => {
					dTasks.resolve(tasks);
					return Promise.resolve();
				}
			})

			return dTasks.pr;


		},
		"getTask": async ({ id }) => {

			const dTask = new Deferred<Task>();

			await tasksMutation({
				"performMutation": tasks => {

					const task = tasks.find(task => task.id === id);

					assert(task !== undefined);

					dTask.resolve(task);

					return Promise.resolve();


				}
			});

			return dTask.pr;


		},
		"addTask": async params => {

			const dId = new Deferred<number>();

			tasksMutation({
				"performMutation": tasks => {

					const id = tasks.length === 0 ? 0 : Math.max(...tasks.map(task => task.id)) + 1;

					tasks.push({
						id,
						...params
					});

					dId.resolve(id);

					return Promise.resolve();

				}
			});

			return dId.pr.then(id => ({ id }))

		},
		"updateTask": async ({ task }) => {

			await tasksMutation({
				"performMutation": tasks => {
					const index = tasks.findIndex(({ id }) => id === task.id);
					assert(index !== -1);
					tasks[index] = task;
					return Promise.resolve()
				}
			})

		},
		"updateTasks": async ({ tasks: updatedTasks }) => {

			await tasksMutation({
				"performMutation": tasks => {

					updatedTasks.forEach(task => {
						const index = tasks.findIndex(({ id }) => id === task.id);
						assert(index !== -1);
						tasks[index] = task;
					});

					return Promise.resolve();
				}
			})

		},
		"deleteTask": async ({ id }) => {

			const dTask = new Deferred<Task>();

			await tasksMutation({
				"performMutation": tasks => {
					const index = tasks.findIndex(task => task.id === id);
					assert(index !== -1);
					const task = tasks[index];
					tasks.splice(index, 1);
					dTask.resolve(task);
					return Promise.resolve();
				}
			});

			return dTask.pr

		},

		"deleteTasks": async ({ ids }) => {

			await tasksMutation({
				"performMutation": tasks => {
					ids.forEach(id => {
						const index = tasks.findIndex(task => task.id === id);
						assert(index !== -1);
						tasks.splice(index, 1);
					});
					return Promise.resolve();
				}
			})

		},
		"deleteAllTasks": async () => {

			await tasksMutation({
				"performMutation": tasks => {
					tasks.splice(0, tasks.length);
					return Promise.resolve();
				}
			})

		}

	};

}

export function createRamTaskApi(
	params: {
		initialTasks: Task[];
	}
): TaskApi {

	const { initialTasks } = params;
	let tasks: Task[] = initialTasks;

	const tasksMutation: DataMutationFunction<Task[]> = ({ performMutation }) => {
		performMutation(tasks);

		return Promise.resolve();
	}

	return createTaskApi({ tasksMutation });

}

export async function createFilePersistedTaskApi(
	params: {
		filePath: string;
	}
) {

	const { filePath } = params;

	const tasks = await (async ()=>{

		if(!fs.existsSync(filePath)){
			return [];
		};

		return JSON.parse((
			await new Promise<Buffer>((resolve, reject) =>
				fs.readFile(filePath, (err, buff) => {

					if (err !== null) {
						reject(err);
						return;
					}

					resolve(buff);

				})
			)
		).toString("utf8"));

	})()

	const tasksMutation: DataMutationFunction<Task[]> =
		runExclusive.build(async ({ performMutation }) => {

			await performMutation(tasks);

			await new Promise<void>(
				(resolve, reject) =>
					fs.writeFile(
						filePath,
						Buffer.from(
							JSON.stringify(tasks, null, 2),
							"utf8"
						),
						err => {

							if (err !== null) {
								reject(err);
								return
							}

							resolve();
						}
					)
			);

		});

	const taskApi = createTaskApi({ tasksMutation })

	return taskApi;

}
