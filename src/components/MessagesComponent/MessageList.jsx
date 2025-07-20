import React from 'react'
import Message from '../../dataLayer/Message'

const MessageList = ({
    message = Message(),
    currentSender
}) => {
  return (
    <div>
      {!currentSender && 
      <div
      className='flex flex-row justify-start'>
      <div className='bg-gray-300 
      m-2 p-3 rounded-r-xl
       rounded-bl-xl rounded-tl-sm max-w-8/10'>
        {message.content}</div>
      </div>
      }

      {currentSender && 
      <div
      className='flex flex-row justify-end'>
      <div className='bg-blue-400 text-white
      m-2 p-3 rounded-l-xl
       rounded-br-xl rounded-tr-sm
       max-w-8/10 '>
        {message.content}</div>
      </div>}
    </div>
  )
}

export default MessageList