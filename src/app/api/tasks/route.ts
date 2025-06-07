interface Task {
  id: number;
  title: string;
  completed: boolean;
}

let tasks: Task[] = [
  { id: 1, title: "learn nextJS", completed: true },
  { id: 2, title: "build a project", completed: false },
];

export async function GET() {
  return Response.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title)
      return Response.json({ errors: "Title is required" }, { status: 400 });

    const newTask: Task = {
      id: tasks.length,
      title: body.title,
      completed: false,
    };

    tasks.push(newTask);
    return Response.json(newTask, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id)
      return Response.json(
        { error: "Missing or invalid task ID" },
        { status: 400 }
      );

    const taskIndex = tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1)
      return Response.json({ error: "No such task found" }, { status: 404 });

    tasks = tasks.filter((task) => task.id !== id);
    return Response.json({ message: "Task deleted" });
  } catch (error) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
