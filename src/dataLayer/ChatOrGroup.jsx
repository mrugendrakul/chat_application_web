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

/**
 * 
 * @param {String} chatId 
 * @param {String} chatName 
 * @param {String} isGroup false
 * @param {Array} members []
 * @param {String} chatPic 
 * @param {Arrya<ChatOrGroup>} memberData []
 * @param {lastMessageData} lastMessage 
 * @param {String} secureAESKey 
 * @returns ChatOrGroupObject
 */
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
