import React from 'react'
import { FaGithub } from 'react-icons/fa'

const Navbar = () => {
  return (
    <nav className="bg-black backdrop-blur-xs relative z-100 p-2 flex justify-between items-center text-white px-4">
        <div className="logo">
            <span className='font-bold text-3xl mx-8' >L!NE∩P</span> 
        </div>
        <ul className="flex gap-8 mx-9 items-center">
            <li>
                <a 
                    href="https://github.com/nihar8262/LineUp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    <FaGithub className="text-2xl" />
                    <span className="font-semibold">GitHub</span>
                </a>
            </li>
        </ul>
    </nav>
  )
}

export default Navbar