import { Timestamp } from "firebase/firestore"

function chatUser(
    username="",
    fcmToken="",
    profilePic=""
){return{
    username,
    fcmToken,
    profilePic
}}

function lastMessageData(
    sender = "",
    content = "",
    timestaamp=""
){
    return{sender,
    content,
    timestaamp}
}


function ChatOrGroup(
    chatId="",
    chatName="",
    isGroup = false,
    members = [],
    chatPic = "",
    memberData = null,
    lastMessage = lastMessageData("","",Timestamp.now()),
    secureAESKey=""
){return {
    chatId,
    chatName,
    isGroup,
    members,
    chatPic,
    memberData,
    lastMessage,
    secureAESKey
}}

export default ChatOrGroup

export {chatUser, lastMessageData}
