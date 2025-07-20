import React, { useEffect, useState } from 'react'
import MessageNavigationBar from './MessageNavigationBar'
import DataRepository from '../../dataLayer/dataRepository'

const MessagesComponent = ({
  currentChatId,
  currentUsername
}) => {
  const [messages,setMessage] = useState({})
  const [chatData,setChatData] = useState(null)
  useEffect(()=>{
    if(!currentChatId){
      console.log("Skipping message api")
      return
    }
    DataRepository().getDataChat(
      currentChatId,currentUsername
    )
    .then((chatd)=>{
      console.log("Getting chatData")
      setChatData(chatd)
      DataRepository().liveMessages(
        currentChatId,
        chatd.secureAESKey,
        (change)=>{
          console.log("messagechage",change)
        },
        (err)=>{
          console.error("Error message",err)
        },
        (add)=>{
          console.log("added message",add)
        },
        (deleteM)=>{
          console.log("Delete message",deleteM)
        }
      )
    })
    .catch((err)=>{
      console.error("Error setting chatData",err)
    })

    // if(!chatData){
    //   console.error("Skipping live messageapi")
    //   return
    // }
  }
  ,[currentChatId])
  return (
    <div className='border-2 h-full flex flex-col'>
      <MessageNavigationBar/>
      MessagesComponent : {currentChatId} : chatName : {chatData?.chatName}

    </div>
  )
}

export default MessagesComponent