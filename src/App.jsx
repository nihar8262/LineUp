import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  const handleChange = (e) => {
    setTodo(e.target.value);
  };

  const saveToLS = (params) => {
    localStorage.setItem("todos", JSON.stringify(todos));
  };

  const setShowCompleted = (e) => {
    setIsCompleted(e.target.checked);
    if (e.target.checked) {
      const completedTodos = todos.filter((item) => item.isCompleted);
      setTodos(completedTodos);
    } else {
      const allTodos = JSON.parse(localStorage.getItem("todos")) || [];
      setTodos(allTodos);
    }
  };

  const handleCheckbox = (e) => {
    let id = e.target.name;
    let index = todos.findIndex((item) => {
      return item.id === id;
    });
    let newTodos = [...todos];
    newTodos[index].isCompleted = !newTodos[index].isCompleted;
    setTodos([...newTodos]);
    saveToLS();
  };

  const handleEdit = (e, id) => {
    let t = todos.filter((i) => i.id === id);
    setTodo(t[0].todo);
    let newTodos = todos.filter((item) => item.id !== id);
    setTodos([...newTodos]);
    saveToLS();
  };
  const handleDelete = (e, id) => {
    let newTodos = todos.filter((item) => item.id !== id);
    setTodos([...newTodos]);
    saveToLS();
  };
  const handleAdd = () => {
    setTodos([...todos, { id: uuidv4(), todo, isCompleted: false }]);
    setTodo("");
    console.log(todos);
    saveToLS();
  };

  return (
    <div class="relative min-h-screen ">
      <div class="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
      <Navbar />
      <div className="md:container   relative z-1000  md:mx-auto md:p-5 p-1 md:w-[60vw] ">
        <div className="bg-gradient-to-tr from-black via-black to-neutral-700   min-h-[80vh] shadow-sm shadow-slate-300  max-h-full p-6   rounded-lg  text-white  ">
          <h1 className="text-5xl text-center font-bold pb-4">Just Do It</h1>
          <div className="bg-gradient-to-r from-black via-white to-black h-[1px]  "></div>
          <h2 className="text-lg pt-5 pb-5 font-bold">Lineup your Work</h2>
          <div className="flex justify-center items-center gap-5">
            <input
              onChange={handleChange}
              value={todo}
              type="text"
              className="bg-white w-1/2 mr-8 rounded-lg p-1 text-black"
              placeholder="Enter your work"
            />
            <button
              onClick={handleAdd}
              disabled={todo.length <= 3}
              className="bg-amber-400/80  p-1 disabled:shadow-amber-400 disabled:shadow-md rounded-lg px-4 font-bold   cursor-pointer"
            >
              Save
            </button>
          </div>
          <h2 className="text-lg pt-10 pb-5 font-bold">Your Todos</h2>
          <input
            type="checkbox"
            className="ml-20 text-green-500"
            onChange={setShowCompleted}
          />{" "}
          Completed Work
          <div className="todos overflow-y-auto max-h-[40vh]  pt-5 ">
            {todos.length === 0 && (
              <div className="text-center text-2xl font-bold">No Todos</div>
            )}
            {todos.map((item) => {
              return (
                (isCompleted || !item.isCompleted) && (
                  <div
                    key={item.id}
                    className="todo  flex w-3/4 justify-between items-center mx-auto bg-gradient-to-tr from-amber-400  to-black p-2  rounded-lg my-5"
                  >
                    <div className="flex items-center gap-5">
                      <input
                        name={item.id}
                        onChange={handleCheckbox}
                        type="checkbox"
                        value={item.isCompleted}
                        id=""
                      />
                      <div className={item.isCompleted ? "line-through" : ""}>
                        {item.todo}
                      </div>
                    </div>
                    <div className="button flex ">
                      <button
                        onClick={(e) => {
                          handleEdit(e, item.id);
                        }}
                        className="mx-4 border backdrop-blur-xl shadow-inner shadow-white hover:shadow-yellow-500 p-1.5 rounded-xl cursor-pointer hover:text-amber-300 "
                      >
                        <FaRegEdit className="text-2xl" />
                      </button>
                      <button
                        onClick={(e) => {
                          handleDelete(e, item.id);
                        }}
                        className="mx-4 border backdrop-blur-xl shadow-inner shadow-white hover:shadow-red-500 p-1.5 rounded-xl cursor-pointer hover:text-red-500"
                      >
                        <MdDelete className="text-2xl " />
                      </button>
                    </div>
                  </div>
                )
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
