// to use "use client" remove async and we will see the page first renders on server and then javascript for event handling rendered on frontend

async function TasksPage() {
  const response = await fetch("http://localhost:3000/api/tasks", {
    cache: "no-store",
  });

  // const tasks = await response.json();
  // console.log("tasks:", tasks);

  return <div>TasksPage</div>;
}
export default TasksPage;
