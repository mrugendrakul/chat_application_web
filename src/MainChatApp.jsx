import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, {  useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { auth } from './firebaseUtils/initFirebase.jsx'
import DataRepository from './dataLayer/dataRepository.jsx';
import EncryptionService from './dataLayer/encryptionService.jsx';
import Message, { ContentType, MessageStatus } from './dataLayer/Message.jsx';
import { Timestamp } from 'firebase/firestore';

function MainChatApp() {
    const { state } = useLocation();
    const [User, SetUser] = useState(null);
    const navigate = useNavigate();
    
    const [text,setText] = useState("");
    // const user = auth.currentUser;
    const [chatName,setChatName] = useState("")
    const [message,setMessage] = useState("Message appears here after decryption")
    const [key,setKey] = useState("")
    const [encMes,setEncMes] = useState("")
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
            User,["mrugendraskulkarni@gmail.com"],chatName,"",false
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
            <button className="bg-green-300 p-2 m-2 transition duration-800 ease-in-out hover:shadow-lg active:inset-shadow-sm active:shadow disabled:bg-gray-300"
            onClick={ ()=>{
                // console.log(User.privateEncryptedRSAKey)
                // // const privateKey = await EncryptionService.stringToPrivateKey(User.privateEncryptedRSAKey)
                // const key = await EncryptionService.decryptAESKeyWithPrivateKey(
                //     "e9Oh+WF3Oeqcj5h3RwJPWCW/tcrCU6Bcd4zv/NQKt/3wyvf44i+tMRO/pfnDbgPYR6Npeo8hkZUdgrE47BzXFsZkzBpCQePNI1Xtt6/Ly5Uy+d5SqpMSWHZk33+K+SxhJ1SHtfsv5kd8AxntUBVYYxtxlPKuqKBSk4XSkuIcggIDFAo9hHUydh9Q4rB11079WdUlEaGZtCBnNwhLLPx8ISfE08yh5Sf5rz+ODq8gfSTFTJyiL9IfFuBOLXn+L5DTcABRVfsycz5o2quHf89mU4NgaJ/RTcYlSJfZMMU+p8WUN0GE72p7rhiBnwaNBcIOz8r+qtOEMCABBmrF8uNfPg=="
                
                //     , User.privateEncryptedRSAKey
                // )
                // // const base64Key = btoa(String.fromCharCode(...key));
                // const base64Key = EncryptionService.byteArrayToString(key)
                // // return base64Key;
                // setKey(base64Key)
                // console.log(base64Key)

                DataRepository().getDataChat("696312966","mrugen@123.com")
                .then((chatData)=>{
                    console.log("Chat data got",chatData)
                    setMessage(chatData)
                    setKey(chatData.secureAESKey)
                })
                .catch((error)=>{
                    console.error("Error getting chat Data :",error)
                })
            }}
            disabled={key!=""}
            >
                Get Chat Data and set AesKey
            </button>
            <button className="bg-blue-300 p-2 m-2 transition duration-800 ease-in-out hover:shadow-lg active:inset-shadow-sm active:shadow disabled:bg-gray-300"
            disabled = {key==""}
            onClick={async()=>{
                const message = "7xPVJz+dBDecZVUJaVDHQSCxbZgG+9pmSSfyDCUdQpg="
               
                // const messageArray = await EncryptionService.stringToByteArray(message)
                const arrayKey = EncryptionService.stringToByteArray(key)
                console.log(key)
                const decryptedMessage = await EncryptionService.aesDecrypt(
                    message,arrayKey
                )
                console.log("Message got is ",decryptedMessage)
                // const MessageString = await EncryptionService.byteArrayToString(decryptedMessage)
                setMessage(decryptedMessage)
            }}
            >
                Aes Decrypt Testing
            </button>
            <br/>
            {`${message}`}
            <br/>
            <input type="text" className="border-2 border-gray-300 rounded-lg p-2 m-2 w-3xl"
            value={encMes}
            onChange={(e) => setEncMes(e.target.value)}
            />
            <button
            className="bg-orange-300 p-2 m-2 transition duration-800 ease-in-out hover:shadow-lg active:inset-shadow-sm active:shadow disabled:bg-gray-300"
            disabled= {key==""}
            onClick = {async ()=>{
                // const arrayKey = EncryptionService.stringToByteArray(key)
                // console.log(arrayKey)
                // const encryptMessage = await EncryptionService.aesEncryptMessages(
                //     encMes,arrayKey
                // )
                // const stringEnyMessage = await EncryptionService.byteArrayToString(encryptMessage)
                // console.log("Message Encrypted is ", stringEnyMessage)

                // const messageId = await 
                DataRepository().sendMessage(Message("",encMes,ContentType.text,User.username,Timestamp.now(),MessageStatus.Sending),
                "696312966",key
                )
                .then((MessageId)=>{
                    console.log("message created successfully", MessageId)
                })
                .catch((error)=>{
                    console.error("Error sending message",error)
                })
                // console.log("Message created",messageId)
                
            }}
            >
                Send message Testing.
            </button>
            <br/>
            <button
            className="bg-orange-300 p-2 m-2 transition duration-800 ease-in-out hover:shadow-lg active:inset-shadow-sm active:shadow disabled:bg-gray-300"
            // disabled = {key == ""}
            onClick={()=>{
                DataRepository().liveChatStore(
                    User.username,
                    (newchat)=>{
                        console.log("Got the new Chat live",newchat)
                    },
                    (modifiedChat)=>{
                        console.log("Modified Chat is",modifiedChat.lastMessage.content)
                    }
                )
            }}
            >
                Get Live chats test
            </button>
        </div>
    )
}

export default MainChatApp  