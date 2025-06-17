import React, { useState } from 'react'
import { NavLink } from 'react-router';

function TopNavigationBarWelcomeScreen({
    Login,Signup
}) {
     const [open, setOpen] = useState(false);
  return (
    <nav className="w-full bg-white shadow-md fixed top-0 z-10">
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <div>
          <NavLink to="/" className="text-2xl font-bold text-blue-500">
            Chat Application
          </NavLink>
        </div>

        <div
        >
            <button className='mx-4'>
                <NavLink to="/login" className="text-gray-800 hover:text-blue-500 px-4 py-2 ">
                    Login
                </NavLink>
            </button>
            <button className='mx-4'>
                <NavLink to="/signup" className="text-gray-800 hover:text-blue-500 px-4 py-2">
                    Signup
                </NavLink>
            </button>
        </div>
      </div>
    </nav>
  )
}

export default TopNavigationBarWelcomeScreen    