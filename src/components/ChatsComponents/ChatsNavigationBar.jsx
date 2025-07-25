import React, { useState } from 'react'

const ChatsNavigationBar = ({username,logout,ChatAddButton}) => {
    const [isMenuOpen,setIsMenuOpen] = useState()

    const toggleMenu = ()=>{
        setIsMenuOpen(!isMenuOpen)
    }
  return (
    <nav className="w-full bg-white dark:bg-black">
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <div className='text-xl font-bold text-blue-700'>
          Chats
        </div>

        <div className="relative flex flex-row gap-4 items-center font-semibold">
          <button className='hover:bg-gray-300 flex flex-row flex-1 items-center gap-1 py-1 px-2 rounded-md active:bg-gray-400'
          onClick={ChatAddButton}
          >
                <svg className='fill-current h-8 w-8' viewBox="0 -960 960 960"  fill="#1f1f1f"><path d="m235.77-290-74.97 74.97q-8.72 8.72-19.76 4.28Q130-215.19 130-227.62v-530.07q0-29.83 21.24-51.07Q172.48-830 202.31-830h475.38q29.83 0 51.07 21.24Q750-787.52 750-757.69V-589q0 12.39-8.81 20.69-8.81 8.31-21.38 8.31-12.58 0-21.19-8.62Q690-577.25 690-590v-167.69q0-5.39-3.46-8.85t-8.85-3.46H202.31q-5.39 0-8.85 3.46t-3.46 8.85V-350h258.85q12.38 0 21.19 8.81t8.81 21.38q0 12.58-8.81 21.19-8.81 8.62-21.19 8.62H235.77Zm76.54-320h255.38q12.75 0 21.38-8.63 8.62-8.63 8.62-21.38 0-12.76-8.62-21.37-8.63-8.62-21.38-8.62H312.31q-12.75 0-21.38 8.63-8.62 8.63-8.62 21.38 0 12.76 8.62 21.37 8.63 8.62 21.38 8.62Zm0 160h135.38q12.75 0 21.38-8.63 8.62-8.63 8.62-21.38 0-12.76-8.62-21.37-8.63-8.62-21.38-8.62H312.31q-12.75 0-21.38 8.63-8.62 8.63-8.62 21.38 0 12.76 8.62 21.37 8.63 8.62 21.38 8.62ZM690-290h-90q-12.75 0-21.37-8.63-8.63-8.63-8.63-21.38 0-12.76 8.63-21.37Q587.25-350 600-350h90v-90q0-12.75 8.63-21.37 8.63-8.63 21.38-8.63 12.76 0 21.37 8.63Q750-452.75 750-440v90h90q12.75 0 21.37 8.63 8.63 8.63 8.63 21.38 0 12.76-8.63 21.37Q852.75-290 840-290h-90v90q0 12.75-8.63 21.37-8.63 8.63-21.38 8.63-12.76 0-21.37-8.63Q690-187.25 690-200v-90Zm-500-60v-420 420Z"/></svg>
                <p>
                  Add Chat
                  </p>
            </button>
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
                <img className="h-8 w-8 rounded-full" src="https://placehold.co/32x32/6366f1/ffffff?text=M" alt="User avatar" />
              </button>
            </div>

            {/* Dropdown menu, conditionally rendered based on isMenuOpen state */}
            {isMenuOpen && (
              <div
                className="origin-top-right absolute right-0 top-8 mt-2 w-48 rounded-md shadow-xl/15 py-1 bg-white dark:bg-gray-700"
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