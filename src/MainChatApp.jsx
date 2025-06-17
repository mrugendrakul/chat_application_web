import { getAuth,signOut } from 'firebase/auth';
import React from 'react'
import { useLocation, useNavigate } from 'react-router'
import firebaseApp from './firebaseUtils/initFirebase.jsx'

function MainChatApp() {
    const {state} = useLocation();
    const navigate = useNavigate();
    if (state===null){
        console.log("No state received, this is the first time visiting this page");
    }
    const auth = getAuth(firebaseApp)
  return (
    <div>
        MainChatApp
        Data received : {state?state : "First time visiting this page"}
        <button className = "bg-red-300 rounded-2xl p-2 m-2 cursor-pointer hover:bg-red-700 hover:text-white"
        onClick = {()=>{
            signOut(auth)
            .then(()=>{
                console.log("User signed out successfully");
                navigate('/')
            })
        }}
        >
            Logout from here
        </button>
        </div>
  )
}

export default MainChatApp  