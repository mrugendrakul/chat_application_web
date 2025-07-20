import React from 'react'
import ChatsComponent from '../components/ChatsComponents/ChatsComponent'
import MessagesComponent from '../components/MessagesComponent/MessagesComponent'

function MainWindow() {
  return (
    <div className='flex h-screen dark:bg-black  dark:text-white'>
      <div className='flex flex-col w-1/4 border-r-2 '>
      <ChatsComponent/>
      </div>
      <div className='flex flex-col w-3/4'>
      <MessagesComponent/>
      </div>
    </div>
  )
}

export default MainWindow