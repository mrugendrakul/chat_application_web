import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, {  useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { auth } from './firebaseUtils/initFirebase.jsx'
import DataRepository from './dataLayer/dataRepository.jsx';
import EncryptionService from './dataLayer/encryptionService.jsx';

function MainChatApp() {
    const { state } = useLocation();
    const [User, SetUser] = useState(null);
    const navigate = useNavigate();
    
    const [text,setText] = useState("");
    // const user = auth.currentUser;
    const [chatName,setChatName] = useState("")
    const [message,setMessage] = useState("")
    useEffect(() => {
        if (state === null) {
        console.log("No state received, this is the first time visiting this page");
    }
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
                    SetUser(user)
                })
                unsubcribe();
            }else{
            //   console.log("No user is logged in");
              navigate('/');
            }
          })
    }, [])

    const SignoutButton=()=>{
        DataRepository().logoutUser()
        .then((stats)=>{
            console.log("User signed out successfully In ui",stats);
            navigate('/')
        })
    }

    const SearchUsers = ()=>{
        DataRepository().getSearchUsersForChat(
            text,User.username

        )
        .then((resultUsers)=>{
            console.log("got users in ui:", resultUsers)
        })
    }

    const CreateNewChat = ()=>{
        DataRepository().createNewChatDataRepo(
            User,["emu@123.com"],chatName,"",false
        )
        .then((Response)=>{
            console.log(Response)
        })
        .catch((error)=>{
            console.error("Error :",error)
        })

    }
    return (
        <div>
            MainChatApp
            Data received : {state ? state : "First time visiting this page"} <br />
            userData : {User ? User.username : "No user data available"} <br />
            <button className="bg-red-300 rounded-2xl p-2 m-2 cursor-pointer hover:bg-red-700 hover:text-white"
                onClick={SignoutButton}
            >
                Logout from here
            </button>
            <br />
            <input type="text" className="border-2 border-gray-300 rounded-lg p-2 m-2 w-3xl"
            value={text}
            onChange={(e) => setText(e.target.value)}
            />
            <br/>
            <button className="bg-amber-200 p-2 m-2 transition duration-300 ease-in-out hover:shadow-lg"
            onClick={SearchUsers}
            >
                Search User Testing
            </button>
            <br/>
            <input type="text" className="border-2 border-gray-300 rounded-lg p-2 m-2 w-3xl"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            />
            <br/>
            <button className="bg-amber-200 p-2 m-2 transition duration-300 ease-in-out hover:shadow-lg disabled:bg-gray-500"
            onClick={CreateNewChat}
            disabled = {chatName === ""}
            >
                Create new chat name
            </button>
            <button className="bg-green-300 p-2 m-2 transition duration-800 ease-in-out hover:shadow-lg active:inset-shadow-sm active:shadow"
            onClick={async ()=>{
                console.log(typeof(User.privateEncryptedRSAKey))
                // const privateKey = await EncryptionService.stringToPrivateKey(User.privateEncryptedRSAKey)
                const key = await EncryptionService.decryptAESKeyWithPrivateKey(
                    "HoaHu8AcABaTT4aR4rEbQ2lJ+CQDVUgM8O+3EMdhr1iYxAhVdj0NvdXIHtwk7+kH4Ij67XAb9D2YiGaVp87cVRs1TChKaTV5wLXRHEa3eymZf5ngrAGOYp5MHDGR1vyx3i21wkrWwGTi73lcZ9VFHF+keFhZZV0vurTpqzaodKgr2nv27xsnla0GFCUlLIMRvHGzimoLzqe81uIcb9mR03I5fy+00/hijCW95zlQYvf+Wq/sVMElKS5imJvkEZPS0fUA2HU4qoYaiDdbVlqxaHQSgnp4AVuI3JOMpFmgP/PZrITEDSwL531vBkD6dPCbpvIVzNt0/UTtxk9VlBYP5g=="
                    , User.privateEncryptedRSAKey
                )
                const base64Key = btoa(String.fromCharCode(...key));
                // return base64Key;
                console.log(base64Key)
            }}
            >
                Get the aes key for chat
            </button>
        </div>
    )
}

export default MainChatApp  