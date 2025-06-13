import React from 'react'

const Navbar = () => {
  return (
    <nav className="bg-black/10 backdrop-blur-xs relative z-100 p-2 flex justify-around items-center text-white">
        <div className="logo">
            <span className='font-bold text-3xl mx-8' >L!NE∩P</span> 
        </div>
        <ul className="flex gap-8 mx-9 ">
            <li className='cursor-pointer hover:font-bold transition-all duration-300'>Home</li>
            <li className='cursor-pointer hover:font-bold transition-all duration-300'>About</li>
        </ul>
    </nav>
  )
}

export default Navbar