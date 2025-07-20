import React, { useEffect, useState } from 'react'
import DataRepository from '../../dataLayer/dataRepository'
import ChatList from './ChatList'
import ChatsNavigationBar from './ChatsNavigationBar'
import { useNavigate } from 'react-router'

const ChatsComponent = (
    {username = 'mrugen@123.com'}
) => {
    const navigate = useNavigate()
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

    const LogoutFunction = ()=>{
        DataRepository().logoutUser()
        .then((val)=>{
            console.log("Logout success",val)
            navigate('/')
        })
        .catch((err)=>{
            console.error("Unable to logout",err)
            alert("Unable to logout")
        })
    }

  return (
      <div className='overflow-y-auto'>
      <ChatsNavigationBar username={username} logout={LogoutFunction}/>
        <div className='w-full block'>
        {Object.entries(chatData).map(([chatId,chat])=>(
          <ChatList key={chatId} chatData = {chat}/>
        ))}
        </div>
    </div>
  )
}

export default ChatsComponent