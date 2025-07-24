import React from 'react'

const SearchGroupList = ({user,addChatGroup,isSelected}) => {
  return (
    <button
      className={`flex
        justify-start
        w-full
        rounded-md
        hover:cursor-pointer
      selection:bg-gray-500/30
      
      dark:hover:bg-gray-50/40
      dark:active:bg-gray-300/40
        ${isSelected?'bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800':'hover:bg-gray-300/30 active:bg-gray-500/30'}
      `}
      onClick={()=>{
        console.log("user clicked",user)
        addChatGroup(user)
      }}
    >
      <div key={user.username}
        className='flex 
        flex-row
        items-center
        w-full overflow-hidden p-2
        '
      >
        <svg viewBox="0 -960 960 960" className='fill-current shrink-0' height='48px' width='48px' ><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" /></svg>

        <div className='flex flex-1 flex-col min-w-0 ml-2 mr-2'>

          <p className='truncate text-start '>
            {user.username}
          </p>
          
        </div>
      </div>
    </button>
  )
}

export default SearchGroupList