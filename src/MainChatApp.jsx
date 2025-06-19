import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, {  useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { auth } from './firebaseUtils/initFirebase.jsx'

function MainChatApp() {
    const { state } = useLocation();
    const [User, SetUser] = useState(null);
    const navigate = useNavigate();
    if (state === null) {
        console.log("No state received, this is the first time visiting this page");
    }
    const [text,setText] = useState("");
    // const user = auth.currentUser;

    

    useEffect(() => {
        const unsubcribe = onAuthStateChanged(auth,(user)=>{
            if(user){
            //   console.log("User is logged in", user);
            //   return
            //   navigate('/chatApp', {state: user.email});
                // Redirect to chatApp with user email
                SetUser(user);
                unsubcribe();
            }else{
            //   console.log("No user is logged in");
              navigate('/');
            }
          })
    }, [])
    return (
        <div>
            MainChatApp
            Data received : {state ? state : "First time visiting this page"} <br />
            userData : {User ? User.email : "No user data available"} <br />
            <button className="bg-red-300 rounded-2xl p-2 m-2 cursor-pointer hover:bg-red-700 hover:text-white"
                onClick={() => {
                    signOut(auth)
                        .then(() => {
                            console.log("User signed out successfully");
                            navigate('/')
                        })
                }}
            >
                Logout from here
            </button>
            <br />
            <input type="text" className="border-2 border-gray-300 rounded-lg p-2 m-2 w-3xl"
            value={text}
            onChange={(e) => setText(e.target.value)}
            />
        </div>
    )
}

export default MainChatApp  