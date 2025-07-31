import React, { useState } from 'react'
import SearchUserList from './SearchUserList'
import SearchGroupList from './SearchGroupList'
import DataRepository, { generateSixDigitUUID } from '../../dataLayer/dataRepository'
import User from '../../dataLayer/User'

const AddChatModel = ({ ChatAddButton,currentUser,reloadChat }) => {
    const [type, setType] = useState("chat")
    const [searchedUsers,setSearchedUsers] = useState([
    ])
    const [selectedChats,setSelectedChat] = useState({username:"",profilePic:""})
    const [selectedGroup,setSelectedGroup] = useState([])
    const [selectedUserGroup,setSelectedUserGroup] = useState([])

    const [chatName,setChatName] = useState("")
    const [searchName,setSearchName] = useState("")

    const [isLoading,setIsLoading] = useState(false)

    const addChat = (chat)=>{
        setSelectedChat(chat)  
    }
    const addChatGroup = (userGrp,isSelected) =>{
        if(isSelected){
            setSelectedUserGroup([...selectedUserGroup,userGrp])
            console.log("Adding",userGrp)
        }
        else{
            setSelectedUserGroup(selectedUserGroup.filter((usr)=>usr.username!==userGrp.username))
            console.log("removing",userGrp)
        }
    }

    const searchUsers= ()=>{
        setIsLoading(true)
        DataRepository().getSearchUsersForChat(
            searchName,currentUser.username
        ).then((data)=>{
            setIsLoading(false)
            setSearchedUsers(
                data
            )
            setSelectedGroup(
                data.map((chatUrs)=>({...chatUrs,isSelected:selectedUserGroup.some((su)=>su.username === chatUrs.username)}))
            )
        })
        .catch((err)=>{
            setIsLoading(false)
            console.error("Error searching data",err)
            setSearchedUsers([])
            setSelectedGroup([])
        })
    }

    const createChatOrGroup= ()=>{
        setIsLoading(true)
        const randomChatName = generateSixDigitUUID(8)
        if(type==="chat"){
            DataRepository().createNewChatDataRepo(
                currentUser,[selectedChats.username],randomChatName,"",false
            )
            .then((data)=>{
                console.log("Createed chat", data)
                ChatAddButton()
                reloadChat()
                
            })
            .catch((err)=>{
                console.error("Error adding chat",err)
                alert("Error adding new chat")
            })
        }
        else{
            DataRepository().createNewChatDataRepo(
                currentUser,[...selectedUserGroup.map(usr=>usr.username)],chatName,"",true
            ).then((data)=>{
                console.log("Createed group", data)
                ChatAddButton()
                reloadChat()
            })
            .catch((err)=>{
                console.error("Error adding chat",err)
                alert("Error adding new Group")
            })
        }
    }
    return (
        <div
            className='h-svh w-svw bg-gray-800/50 flex fixed justify-center items-center'
            // onClick={ChatAddButton}
        >

            <div className='bg-white md:w-4/10 md:h-8/10 min-w-md md:rounded-3xl flex flex-col md:p-2 p-4 h-full w-full rounded-none 
            dark:bg-gray-800'>
                <div className=' p-4 font-bold text-2xl  flex items-center'>
                    Add new Chat.
                </div>

                <div className='relative flex flex-row gap-1 m-2 p-1 bg-gray-100 rounded-md dark:bg-gray-600'>
                    <div
                        className={`
                    absolute w-[calc(50%-0.25rem)] top-1 h-[calc(100%-0.5em)] left-1 p-2 rounded-md bg-white shadow-md
                    transition-transform ease-in-out dark:bg-gray-400
                    ${type === "chat" ? 'translate-0 bg-white' : 'translate-x-full'}`}
                    >

                    </div>
                    <button
                        className={`relative w-1/2  p-2 rounded-md  z-10 font-bold`}
                        onClick={() => { setType("chat") 
                            setSelectedUserGroup([])
                        }}
                    >
                        Chat</button>
                    <button
                        className={`relative w-1/2 p-2 rounded-md z-10  font-bold`}
                        onClick={() => { setType("group") 
                            setSelectedChat([])
                        }}
                    >
                        Group</button>
                </div>

                <div className=''></div>

                {
                    (type === "group")&& 
                    <input
                            type='text'
                            className='p-2 mx-2 mb-4 bg-gray-100 rounded-md focus:outline-none text-md focus:ring-2 focus:ring-blue-400 transition-discrete
                            dark:bg-gray-600'
                            placeholder='Group name'
                            value={chatName}
                            onChange={(e)=>setChatName(e.target.value)}
                        />
                }

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        console.log("Enter pressed here")
                        searchUsers()
                    }}
                    className='w-full p-2'>
                    <div className='relative rounded-md flex flex-row gap-2 items-center focus:outline-none '>
                        <svg viewBox="0 -960 960 960" 
                        className='absolute fill-current w-10 h-8 p-1 border-r-1 border-gray-500 z-10' 
                        ><path d="M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
                        <input
                            type='text'
                            className='relative p-2 pl-12 bg-gray-100 flex-8/10 rounded-md focus:outline-none text-md focus:ring-2 focus:ring-blue-400
                            dark:bg-gray-600'
                            placeholder='Search user'
                            value={searchName}
                            onChange={(e)=>{setSearchName(e.target.value)}}
                        />
                        <button
                        type='submit'
                        className='relative p-2 bg-blue-400 rounded-md text-white'
                        
                        >
                        Search
                        </button>
                    </div>
                </form>

                <div
                className='mt-1 overflow-y-auto inset-shadow-xs flex flex-1'
                >

                {type==="chat" && <div
                className='w-full'>
                    {searchedUsers.map((user)=><SearchUserList key={user.username} user={user} addChatUser = {addChat} 
                    isSelected={selectedChats.username === user.username}/>)}
                </div>}

                {type==="group" && <div
                className='w-full'>
                    {selectedGroup.map((user)=><SearchGroupList key={user.username} user={user} 
                    addChatGroup = {()=>{
                        addChatGroup(user,!user.isSelected) 
                        setSelectedGroup(selectedGroup.map(
                        (grp)=>{if(grp.username===user.username) {
                            grp.isSelected = !grp.isSelected
                        }
                            return grp
                        }
                    ))}} 
                    isSelected={selectedUserGroup.some((su)=>su.username === user.username)} />)}
                </div>}
                </div>
                
                
                <div className='p-2 flex flex-row justify-end gap-2'>
                    <button 
                    className='p-2 bg-gray-300 rounded-md cursor-pointer'
                    onClick={ChatAddButton}
                    >
                        Cancel
                    </button>
                    <button 
                        className='p-2 bg-blue-400 rounded-md cursor-pointer text-white disabled:bg-gray-500'
                        disabled={selectedChats.length == 0 && selectedUserGroup.length == 0}
                        onClick={()=>{
                            console.log("Ading chat")
                            createChatOrGroup()
                            
                        }}
                    >
                        Create {type==="chat"?'chat':'group'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddChatModel