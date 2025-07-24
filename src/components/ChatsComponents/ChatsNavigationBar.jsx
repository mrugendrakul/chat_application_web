import React, { useState } from 'react'

const ChatsNavigationBar = ({username,logout}) => {
    const [isMenuOpen,setIsMenuOpen] = useState()

    const toggleMenu = ()=>{
        setIsMenuOpen(!isMenuOpen)
    }
  return (
    <nav className="w-full bg-white dark:bg-black shadow-md fixed top-0 z-10">
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <div className='text-xl font-bold text-blue-700'>
          Chats
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
                <img className="h-8 w-8 rounded-full" src="https://placehold.co/32x32/6366f1/ffffff?text=U" alt="User avatar" />
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
                <button className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-start'>
                    {username}
                </button>
                <button className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-start' role='menuitem' tabIndex="-1"
                onClick={logout}>
                    Logout
                </button>
              </div>
            )}
          </div>
      </div>
    </nav>
  )
}

export default ChatsNavigationBar