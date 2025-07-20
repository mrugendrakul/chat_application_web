import React, { useEffect, useState } from 'react'
import ChatsComponent from '../components/ChatsComponents/ChatsComponent'
import MessagesComponent from '../components/MessagesComponent/MessagesComponent'
import { onAuthStateChanged } from 'firebase/auth'
import DataRepository from '../dataLayer/dataRepository'
import { useNavigate } from 'react-router'
import { auth } from '../firebaseUtils/initFirebase.jsx'
import LoadingStatus from '../components/LoadingStatus.jsx'

function MainWindow() {
  const [currentChatId,setCurrentChatid]= useState(null)
  const [loading,setLoading] = useState(false)
  const [user,setUser] = useState()
  const navigate = useNavigate()

  useEffect(()=>{
    setLoading(true)
    setTimeout(()=>{
      console.log("Delay over")

      const unsubcribe = onAuthStateChanged(auth,(user)=>{
              if(user){
              //   console.log("User is logged in", user);
              //   return
              //   navigate('/chatApp', {state: user.email});
                  // Redirect to chatApp with user email
                  // SetUser(user);
                  DataRepository().getCurrentUser()
                  .then((user)=>{
                      console.log("Current user ",user)
                      setUser(user)
                      setLoading(false)
                  })
                  unsubcribe();
              }else{
              //   console.log("No user is logged in");
              setLoading(false)
                navigate('/');
              }
            })
    },0)
  },[])

  return (
    <div className='flex h-screen dark:bg-black  dark:text-white'>
      {loading && <LoadingStatus/>}
      {!loading && <><div className='flex flex-col w-1/4 border-r-2 '>
        <ChatsComponent username={user?.username} setCurrentChatid={setCurrentChatid} />
      </div><div className='flex flex-col w-3/4'>
          <MessagesComponent currentChatId={currentChatId} currentUsername={user?.username} />
        </div></>}
    </div>
  )
}

export default MainWindow