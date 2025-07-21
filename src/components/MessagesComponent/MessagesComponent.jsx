import React, { useEffect, useMemo, useState } from 'react'
import MessageNavigationBar from './MessageNavigationBar'
import DataRepository from '../../dataLayer/dataRepository'
import MessageList from './MessageList'
import LoadingStatus from '../LoadingStatus'
import Message, { ContentType, MessageStatus } from '../../dataLayer/Message'
import { Timestamp } from 'firebase/firestore'

const MessagesComponent = ({
  currentChatId,
  currentUsername
}) => {
  const [messages, setMessage] = useState({})
  const [chatData, setChatData] = useState(null)
  const [isloading, setIsLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  useEffect(() => {
    if (!currentChatId) {
      console.log("Skipping message api")
      return
    }
    setIsLoading(true)
    DataRepository().getDataChat(
      currentChatId, currentUsername
    )
      .then((chatd) => {
        console.log("Getting chatData")
        setChatData(chatd)
        setIsLoading(false)
        DataRepository().liveMessages(
          currentChatId,
          chatd.secureAESKey,
          (change) => {
            // console.log("messagechage", change)
            const messageId = change.messageId
            setMessage(prevMessages => ({ ...prevMessages, [messageId]: change }))
          },
          (err) => {
            // console.error("Error message", err)
          },
          (add) => {
            // console.log("added message", add)
            const messageId = add.messageId
            setMessage(prevMessages => ({ ...prevMessages, [messageId]: add }))
          },
          (deleteM) => {
            // console.log("Delete message", deleteM)
            const messageId = deleteM.messageId
            setMessage(prevMessage => {
              const { [messageId]: notReqd, ...requidedMessages } = prevMessage
              return requidedMessages
            })
          }
        )
      })
      .catch((err) => {
        console.error("Error setting chatData", err)
      })

    // if(!chatData){
    //   console.error("Skipping live messageapi")
    //   return
    // }
  }
    , [currentChatId])

  const sortedMessages = useMemo(() => {
    console.log("Re-sorting messages...");
    // 1. Convert the messages object to an array.
    const messagesArray = Object.values(messages);

    // 2. Sort the array based on the timestamp with added safety checks.
    return messagesArray.sort((a, b) => {
      // Safely access toDate method and handle cases where timestamp might be missing or invalid.
      const dateA = a?.timeStamp?.toDate ? a.timeStamp.toDate() : null;
      const dateB = b?.timeStamp?.toDate ? b.timeStamp.toDate() : null;

      // If either date is invalid or null, treat them as equal to prevent sorting errors.
      if (!dateA || !dateB) {
        return 0;
      }

      // For ascending order (oldest first), subtract dateA from dateB.
      return dateB - dateA;
    });
  }, [messages]);

  const SendMessage = () => {
    const key = chatData.secureAESKey
    DataRepository().sendMessage(
      Message(
        "",
        newMessage,
        ContentType.text,
        currentUsername,
        Timestamp.now(),
        MessageStatus.Send
      ),
      currentChatId,
      key
    )
      .then((mesId) => {
        console.log("message created successfully", mesId)
        setNewMessage("")
      })
      .catch((error) => {
        console.error("Error sending message", error)
      })
  }

  return (
    <div className='h-full flex flex-col'>
      {isloading && <LoadingStatus />}
      {currentChatId && <div className='flex flex-col h-full'>
        <MessageNavigationBar username={chatData?.chatName} members ={chatData?.members} />

        <div className='flex flex-col-reverse flex-1 overflow-y-auto'>
          {sortedMessages?.map((message, messageId) => {
            return <MessageList key={messageId} message={message} currentSender={message.senderId === currentUsername} />
          })}
        </div>
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-900"
              onClick={SendMessage}>
              <svg className='fill-white' height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m748.92-446.46-558.3 235.38q-18.08 7.23-34.35-3.11Q140-224.54 140-244.23v-471.54q0-19.69 16.27-30.04 16.27-10.34 34.35-3.11l558.3 235.38q22.31 9.85 22.31 33.54 0 23.69-22.31 33.54ZM200-280l474-200-474-200v147.69L416.92-480 200-427.69V-280Zm0 0v-400 400Z" /></svg>
            </button>
          </div>
        </div>
      </div>}
      {!currentChatId && <div>
        Select a chat id to see the messages.
      </div>}

    </div>
  )
}

export default MessagesComponent