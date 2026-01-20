import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [todo, setTodo] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [todos, setTodos] = useState([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all"); // all, 1hour, 24hours, 7days

  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem("todos", JSON.stringify(todos));
    }
  }, [todos]);

  const handleChange = (e) => {
    setTodo(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleDateChange = (e) => {
    setDeadline(e.target.value);
  };

  const toggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  const handleCheckbox = (e) => {
    let id = e.target.name;
    let index = todos.findIndex((item) => {
      return item.id === id;
    });
    let newTodos = [...todos];
    newTodos[index].isCompleted = !newTodos[index].isCompleted;
    setTodos([...newTodos]);
  };

  const handleEdit = (e, id) => {
    let t = todos.filter((i) => i.id === id);
    setTodo(t[0].todo);
    setDescription(t[0].description || "");
    setDeadline(t[0].deadline || "");
    let newTodos = todos.filter((item) => item.id !== id);
    setTodos([...newTodos]);
  };
  const handleDelete = (e, id) => {
    let newTodos = todos.filter((item) => item.id !== id);
    setTodos([...newTodos]);
  };
  
  const handleDeleteFiltered = () => {
    if (timeFilter === "all") {
      if (window.confirm("Are you sure you want to delete ALL todos? This action cannot be undone.")) {
        setTodos([]);
        localStorage.removeItem("todos");
      }
    } else {
      const filterName = timeFilter === "1hour" ? "last hour" : timeFilter === "24hours" ? "last 24 hours" : "last 7 days";
      if (window.confirm(`Are you sure you want to delete all todos from ${filterName}?`)) {
        const filteredTodos = todos.filter((item) => {
          if (!item.createdAt) return true;
          const now = new Date();
          const createdAt = new Date(item.createdAt);
          const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
          
          if (timeFilter === "1hour" && hoursDiff <= 1) return false;
          if (timeFilter === "24hours" && hoursDiff <= 24) return false;
          if (timeFilter === "7days" && hoursDiff <= 168) return false;
          return true;
        });
        setTodos(filteredTodos);
      }
    }
  };
  
  const handleAdd = () => {
    setTodos([{ id: uuidv4(), todo, description, deadline, isCompleted: false, createdAt: new Date().toISOString() }, ...todos]);
    setTodo("");
    setDescription("");
    setDeadline("");
  };

  return (
    <div class="relative min-h-screen ">
      <div class="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
      <Navbar />
      <div className="md:container relative z-1000  md:mx-auto md:pt-16 p-8 pt-20 md:w-[70vw] pb-16">
        <div className="bg-gradient-to-tr from-black via-black to-neutral-700 shadow-sm shadow-slate-300 p-8 rounded-lg text-white">
          <h1 className="text-5xl text-center font-bold pb-4">Just Do It</h1>
          <div className="bg-gradient-to-r from-black via-white to-black h-[1px]  "></div>
          <h2 className="text-lg pt-5 pb-5 font-bold">Lineup your Work</h2>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative w-full sm:flex-1">
                <input
                  onChange={handleChange}
                  value={todo}
                  type="text"
                  className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-amber-400/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 rounded-xl px-5 py-3 text-black font-medium text-lg placeholder:text-gray-400 transition-all duration-300 shadow-md focus:shadow-xl focus:shadow-amber-400/30 outline-none"
                  placeholder="✨ What needs to be done?"
                />
              </div>
              <div className="relative w-full sm:w-auto sm:min-w-[180px]">
                <input
                  onChange={handleDateChange}
                  value={deadline}
                  type="date"
                  className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-purple-400/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-400/20 rounded-xl px-4 py-3 text-black font-medium text-base transition-all duration-300 shadow-md focus:shadow-xl focus:shadow-purple-400/30 outline-none cursor-pointer"
                />
              </div>
            </div>
            <div className="relative w-full">
              <textarea
                onChange={handleDescriptionChange}
                value={description}
                rows="2"
                className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-blue-400/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-400/20 rounded-xl px-5 py-3 text-black font-medium text-base placeholder:text-gray-400 transition-all duration-300 shadow-md focus:shadow-xl focus:shadow-blue-400/30 outline-none resize-none"
                placeholder="📝 Add description (optional)"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={todo.length <= 3}
              className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-black font-bold text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-amber-500/50 disabled:shadow-none transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                💾 Save
              </span>
            </button>
          </div>
          <div className="pt-8 pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Filter by Time</h2>
              <button
                onClick={handleDeleteFiltered}
                className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
              >
                🗑️ <span className="hidden xs:inline">Delete</span> {timeFilter === "all" ? "All" : timeFilter === "1hour" ? "Last Hour" : timeFilter === "24hours" ? "Last 24h" : "Last 7d"} <span className="hidden xs:inline">Todos</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setTimeFilter("all")}
                className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                  timeFilter === "all"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-gray-600/50 text-gray-300 hover:bg-gray-600/80"
                }`}
              >
                📋 <span className="hidden sm:inline">All </span>Todos
              </button>
              <button
                onClick={() => setTimeFilter("1hour")}
                className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                  timeFilter === "1hour"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50"
                    : "bg-gray-600/50 text-gray-300 hover:bg-gray-600/80"
                }`}
              >
                ⚡ <span className="hidden sm:inline">Last </span>Hour
              </button>
              <button
                onClick={() => setTimeFilter("24hours")}
                className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                  timeFilter === "24hours"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50"
                    : "bg-gray-600/50 text-gray-300 hover:bg-gray-600/80"
                }`}
              >
                🌞 <span className="hidden sm:inline">Last </span>24h
              </button>
              <button
                onClick={() => setTimeFilter("7days")}
                className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                  timeFilter === "7days"
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50"
                    : "bg-gray-600/50 text-gray-300 hover:bg-gray-600/80"
                }`}
              >
                📅 <span className="hidden sm:inline">Last </span>7d
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 pb-5">
            <h2 className="text-lg font-bold">Your Todos</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Show Completed</span>
              <div
                onClick={toggleShowCompleted}
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  showCompleted ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    showCompleted ? 'translate-x-7' : 'translate-x-0'
                  }`}
                ></div>
              </div>
            </div>
          </div>
          <div className="todos pt-5 pb-4 max-h-[50vh] overflow-y-auto">
            {todos.length === 0 && (
              <div className="text-center text-2xl font-bold">No Todos</div>
            )}
            {todos
              .filter((item) => {
                // Time filter
                if (timeFilter !== "all" && item.createdAt) {
                  const now = new Date();
                  const createdAt = new Date(item.createdAt);
                  const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
                  
                  if (timeFilter === "1hour" && hoursDiff > 1) return false;
                  if (timeFilter === "24hours" && hoursDiff > 24) return false;
                  if (timeFilter === "7days" && hoursDiff > 168) return false;
                }
                return true;
              })
              .map((item) => {
              return (
                (showCompleted || !item.isCompleted) && (
                  <div
                    key={item.id}
                    className="todo group flex flex-col sm:flex-row w-full md:w-4/5 justify-between sm:items-center gap-3 mx-auto bg-gradient-to-r from-amber-400/90 via-amber-300/80 to-yellow-400/90 p-4 rounded-xl my-4 shadow-lg hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-[1.02] border border-amber-200/30"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="relative mt-1">
                        <input
                          name={item.id}
                          onChange={handleCheckbox}
                          type="checkbox"
                          checked={item.isCompleted}
                          className="appearance-none w-5 h-5 sm:w-6 sm:h-6 border-2 border-black rounded-md bg-white/80 checked:bg-green-500 checked:border-green-600 cursor-pointer transition-all duration-200 hover:scale-110"
                        />
                        {item.isCompleted && (
                          <svg
                            className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 text-white pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div
                          className={`text-black font-semibold text-base sm:text-lg transition-all duration-300 break-words ${
                            item.isCompleted
                              ? 'line-through opacity-60 text-gray-700'
                              : ''
                          }`}
                        >
                          {item.todo}
                        </div>
                        {item.description && (
                          <div className={`text-black/80 text-sm break-words ${
                            item.isCompleted ? 'line-through opacity-50' : ''
                          }`}>
                            {item.description}
                          </div>
                        )}
                        {item.deadline && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="bg-purple-600/90 text-white px-2 sm:px-3 py-1 rounded-full font-medium shadow-md flex items-center gap-1">
                              📅 {new Date(item.deadline).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="button flex gap-2 justify-end sm:justify-start">
                      <button
                        onClick={(e) => {
                          handleEdit(e, item.id);
                        }}
                        className="bg-black/80 hover:bg-blue-600 text-white p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg group-hover:rotate-6"
                      >
                        <FaRegEdit className="text-xl" />
                      </button>
                      <button
                        onClick={(e) => {
                          handleDelete(e, item.id);
                        }}
                        className="bg-black/80 hover:bg-red-600 text-white p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg group-hover:-rotate-6"
                      >
                        <MdDelete className="text-xl" />
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
