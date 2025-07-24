import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ChatsComponent from '../components/ChatsComponents/ChatsComponent'
import MessagesComponent from '../components/MessagesComponent/MessagesComponent'
import { onAuthStateChanged } from 'firebase/auth'
import DataRepository from '../dataLayer/dataRepository'
import { useNavigate } from 'react-router'
import { auth } from '../firebaseUtils/initFirebase.jsx'
import LoadingStatus from '../components/LoadingStatus.jsx'
import AddChatModel from '../components/ChatsComponents/AddChatModel.jsx'

function MainWindow() {
  const [currentChatId, setCurrentChatid] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isAddingChat, setIsAddingChat] = useState(false)
  const [user, setUser] = useState()
  const [chatData, setchatData] = useState({})
  const [groups,setGroups] = useState({})

  const navigate = useNavigate()

  const liveChatSubscriber = useCallback(() => {
    console.log("Chat subs")
    setchatData({})
    DataRepository().liveChatStore(
      user?.username,
      (newChat) => {
        console.log("Setting data",newChat)
        const newChatId = newChat.chatId
        setchatData(prevChats => ({ ...prevChats, [newChatId]: newChat }))

      },
      (modifiedChat) => {
        const modChatId = modifiedChat.chatId
        setchatData(prevChats => ({ ...prevChats, [modChatId]: modifiedChat }))
      },
      (deletedChat) => {
        const delchatId = deletedChat.chatId
        setchatData(prevChats => {
          const { [delchatId]: deletedvalue, ...remaining } = prevChats
          return remaining
        })
      }
    )
  }, [user?.username])

  const liveGroupSubscriber = useCallback(()=>{
    setGroups({})
    console.log("groups subs")
    DataRepository().liveGroupStore(
      user?.username,
      (newChat) => {
        console.log("Setting grp")
        const newChatId = newChat.chatId
        setGroups(prevChats => ({ ...prevChats, [newChatId]: newChat }))

      },
      (modifiedChat) => {
        const modChatId = modifiedChat.chatId
        setGroups(prevChats => ({ ...prevChats, [modChatId]: modifiedChat }))
      },
      (deletedChat) => {
        const delchatId = deletedChat.chatId
        setGroups(prevChats => {
          const { [delchatId]: deletedvalue, ...remaining } = prevChats
          return remaining
        })
      }
    )
  },[user?.username])

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      console.log("Delay over")

      const unsubcribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          //   console.log("User is logged in", user);
          //   return
          //   navigate('/chatApp', {state: user.email});
          // Redirect to chatApp with user email
          // SetUser(user);
          DataRepository().getCurrentUser()
            .then((user) => {
              console.log("Current user ", user)
              setUser(user)
              setLoading(false)
            })
          unsubcribe();
        } else {
          //   console.log("No user is logged in");
          // unsubcribe();
          setLoading(false)
          navigate('/');
        }
      })
    }, 0)
  }, [])

  useEffect(() => {
    console.log("use effect inside the chatsComponent")
    if (!user?.username) {
      console.log("Skipping calling api")
      return
    }
    liveChatSubscriber()
    // liveGroupSubscriber()

  }, [liveChatSubscriber,liveGroupSubscriber])

  const sortedChats = useMemo(()=>{
    const chatsValues = Object.values(chatData)
    return chatsValues.sort((a,b)=>{
      const dateA = a?.lastMessage?.timeStamp?.toDate ? a.lastMessage?.timeStamp.toDate() : null;
      const dateB = b?.lastMessage?.timeStamp?.toDate ? b.lastMessage?.timeStamp.toDate() : null;

      // If either date is invalid or null, treat them as equal to prevent sorting errors.
      if (!dateA || !dateB) {
        return 0;
      }

      // For ascending order (oldest first), subtract dateA from dateB.
      return dateB - dateA;
    })
  },[chatData])




  const ChatAddButton = () => {
    setIsAddingChat(!isAddingChat)
  }

  return (
    <div className='flex h-svh dark:bg-black  dark:text-white'>
      {loading && <LoadingStatus />}
      {!loading && <><div className='flex flex-col w-1/4 border-r-2 '>
        <ChatsComponent username={user?.username} setCurrentChatid={setCurrentChatid}
          ChatAddButton={ChatAddButton} chatData={sortedChats} groupData = {groups} />
      </div><div className='flex flex-col w-3/4'>
          <MessagesComponent currentChatId={currentChatId} currentUsername={user?.username} />
        </div>
        {isAddingChat && <AddChatModel ChatAddButton={ChatAddButton} currentUser={user} reloadChat={liveChatSubscriber}/>}
      </>
      }
    </div>
  )
}

export default MainWindow