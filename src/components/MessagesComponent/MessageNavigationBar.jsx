import React, { useState } from 'react'

const MessageNavigationBar = ({username,members}) => {
    const [isMenuOpen,setIsMenuOpen] = useState()

    const toggleMenu = ()=>{
        setIsMenuOpen(!isMenuOpen)
    }
  return (
    <nav className="w-full bg-white dark:bg-black shadow-md">
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <div className='text-xl font-bold text-blue-700'>
          {username}
        </div>

        <div className="relative">
            <div>
              <button
                type="button"
                onClick={toggleMenu}
                className="bg-white dark:bg-gray-800 flex text-sm rounded-full active:ring-2"
                id="menu-button"
                // aria-expanded={isMenuOpen}
                // aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <svg className='fill-current' height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>
              </button>
            </div>

            {/* Dropdown menu, conditionally rendered based on isMenuOpen state */}
            {isMenuOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-xl/15 py-1 bg-white dark:bg-gray-700"
                role="menu"
                // aria-orientation="vertical"
                // aria-labelledby="menu-button"
                // tabIndex="-1"
              >
                <button className='block truncate px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-start'>
                    {username}
                </button>
                {members.map((member)=><button className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-start' role='menuitem' tabIndex="-1"
               >
                    {member}
                </button>)}
              </div>
            )}
          </div>
      </div>
    </nav>
  )
}

export default MessageNavigationBar