import React, { useEffect, useState } from 'react'
import DataRepository from '../../dataLayer/dataRepository'
import ChatList from './ChatList'

const ChatsComponent = (
    {username = 'mrugen@123.com'}
) => {
    const [chatData,setchatData] = useState({
    })
    useEffect(()=>{
        DataRepository().liveChatStore(
            username,
            (newChat)=>{
                console.log("Setting data")
                const newChatId = newChat.chatId
                setchatData(prevChats =>({...prevChats,[newChatId]:newChat} ))
                
            },
            (modifiedChat)=>{
                const modChatId = modifiedChat.chatId
                setchatData(prevChats => ({...prevChats, [modChatId]:modifiedChat}))
            }
        )
    },[])

  return (
    <div className='dark:bg-gray-800 h-dvh dark:text-white w-full max-w-xl'>
        All chats getting
        {/* {displayChats()} */}
        {Object.entries(chatData).map(([chatId,chat])=>(
          <ChatList key={chatId} chatData = {chat}/>
          
        ))}
    </div>
  )
}

export default ChatsComponent