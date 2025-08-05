import React from 'react'
import Message from '../../dataLayer/Message'

const MessageList = ({
  isGroup,
    message = Message(),
    currentSender
}) => {
  return (
    <div>
      {!currentSender && 
      <div className='flex flex-col'>
        {isGroup && <p className='ml-2 p-0'
        >{message.senderId}</p>}
      <div
      className='flex flex-row justify-start'>
        
      <div className='bg-gray-300 text-black
      m-2 p-3 rounded-r-xl
       rounded-bl-xl rounded-tl-sm max-w-8/10 flex flex-col'>
        {message.content}
        <p className='mt-2 p-0 text-sm border-t-1 border-t-gray-800'>{message.timeStamp.toDate().toLocaleString()}</p>
        
        </div>
      </div>
      </div>
      }

      {currentSender && 
      <div
      className='flex flex-row justify-end'>
      <div className='bg-blue-400 text-white
      m-2 p-3 rounded-l-xl
       rounded-br-xl rounded-tr-sm
       max-w-8/10 '>
        {message.content}
        <p className='mt-2 p-0 text-sm border-t-1 border-t-gray-800'>{message.timeStamp.toDate().toLocaleString()}</p>
        </div>
      </div>}
    </div>
  )
}

export default MessageList