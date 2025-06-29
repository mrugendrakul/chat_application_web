import { Timestamp } from "firebase/firestore"


const MessageStatus = Object.freeze({
    Sending: "Sending",
    Send: "Send",
    Delivered: "Delivered",
    Read: "Read",
    Error: "Error",
    Deleting: "Deleting"
})

const ContentType = Object.freeze({
    text: "text",
    image: "image",
    document: "document",
    audio: "audio",
    video: "video",
    deleted: "deleted",
    default: "default"
})

function Message(
    messageId = "",
    content = "",
    contentType = ContentType.text,
    senderId= "",
    timeStamp = Timestamp.now(),
    status = MessageStatus.Sending

) { 
    return{
        messageId,content,contentType,senderId,timeStamp,status
    }
}

export default Message
export { MessageStatus, ContentType}