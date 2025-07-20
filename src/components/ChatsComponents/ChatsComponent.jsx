import React, { useEffect, useState } from 'react'
import DataRepository from '../../dataLayer/dataRepository'
import ChatList from './ChatList'
import ChatsNavigationBar from './ChatsNavigationBar'
import { useNavigate } from 'react-router'

const ChatsComponent = (
    {username,setCurrentChatid}
) => {
    const navigate = useNavigate()
    const [chatData,setchatData] = useState({
    })
    useEffect(()=>{
        console.log("use effect inside the chatsComponent")
        if(!username){
            console.log("Skipping calling api")
            return
        }
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
            },
            (deletedChat)=>{
                const delchatId = deletedChat.chatId
                setchatData(prevChats=>{ const {[delchatId]:deletedvalue, ... remaining} = prevChats
                return remaining})
            }
        )
    },[username])

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
      <div className='overflow-y-auto h-full'>
      <ChatsNavigationBar username={username} logout={LogoutFunction}/>
        <div className='w-full block'>
        {Object.entries(chatData).map(([chatId,chat])=>(
          <ChatList key={chatId} chatData = {chat} onClickChat={setCurrentChatid}/>
        ))}
        </div>
    </div>
  )
}

export default ChatsComponent