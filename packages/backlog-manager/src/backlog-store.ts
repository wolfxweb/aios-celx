import { join } from "node:path";
import { readYaml, writeYaml } from "@aios-celx/artifact-manager";
import type {
  EpicsDocument,
  StoriesDocument,
  StoryStatus,
  Task,
  TaskStatus,
  TasksDocument,
} from "@aios-celx/shared";
import {
  deriveStoryStatusFromTasks,
  EpicsDocumentSchema,
  StoriesDocumentSchema,
  TasksDocumentSchema,
} from "@aios-celx/shared";

const EPICS = "backlog/epics.yaml";
const STORIES = "backlog/stories.yaml";
const TASKS = "backlog/tasks.yaml";

export async function loadEpics(projectRoot: string): Promise<EpicsDocument> {
  const raw = await readYaml<unknown>(join(projectRoot, EPICS));
  return EpicsDocumentSchema.parse(raw);
}

export async function loadStories(projectRoot: string): Promise<StoriesDocument> {
  const raw = await readYaml<unknown>(join(projectRoot, STORIES));
  return StoriesDocumentSchema.parse(raw);
}

export async function loadTasks(projectRoot: string): Promise<TasksDocument> {
  const raw = await readYaml<unknown>(join(projectRoot, TASKS));
  return TasksDocumentSchema.parse(raw);
}

export async function saveTasks(projectRoot: string, doc: TasksDocument): Promise<void> {
  const parsed = TasksDocumentSchema.parse(doc);
  await writeYaml(join(projectRoot, TASKS), parsed);
}

export async function saveStories(projectRoot: string, doc: StoriesDocument): Promise<void> {
  const parsed = StoriesDocumentSchema.parse(doc);
  await writeYaml(join(projectRoot, STORIES), parsed);
}

export function findTaskById(doc: TasksDocument, taskId: string): Task | undefined {
  return doc.tasks.find((t) => t.id === taskId);
}

export function listTasksByStoryId(doc: TasksDocument, storyId: string): Task[] {
  return doc.tasks.filter((t) => t.storyId === storyId);
}

/** Lexicographic sort by task id (stable, predictable order). */
export function sortTasksById(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export function listTasksByStatus(doc: TasksDocument, status: TaskStatus | string): Task[] {
  return doc.tasks.filter((t) => t.status === status);
}

export function updateTaskStatus(
  doc: TasksDocument,
  taskId: string,
  status: TaskStatus | string,
): TasksDocument {
  const tasks = doc.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
  if (!tasks.some((t) => t.id === taskId)) {
    throw new Error(`Task not found: ${taskId}`);
  }
  return { tasks };
}

export function updateStoryStatus(
  doc: StoriesDocument,
  storyId: string,
  status: string,
): StoriesDocument {
  const stories = doc.stories.map((s) => (s.id === storyId ? { ...s, status } : s));
  if (!stories.some((s) => s.id === storyId)) {
    throw new Error(`Story not found: ${storyId}`);
  }
  return { stories };
}

/** Recompute story status from all tasks with this storyId and persist (Bloco 4.4). */
export async function syncStoryStatusFromTasks(
  projectRoot: string,
  storyId: string,
): Promise<{ status: StoryStatus }> {
  const [tasksDoc, storiesDoc] = await Promise.all([loadTasks(projectRoot), loadStories(projectRoot)]);
  const tasks = listTasksByStoryId(tasksDoc, storyId);
  const status = deriveStoryStatusFromTasks(tasks);
  const updated = updateStoryStatus(storiesDoc, storyId, status);
  await saveStories(projectRoot, updated);
  return { status };
}
