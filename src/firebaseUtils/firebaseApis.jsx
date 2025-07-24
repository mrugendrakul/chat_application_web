import { getAuth } from 'firebase/auth';
import firebaseApp from './initFirebase.jsx';
import { addDoc, arrayUnion, collection, doc, getDoc, getDocFromCache, getDocs, getFirestore, limit, onSnapshot, Query, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import AESKeyData from '../dataLayer/AESKeyData.jsx';
import Message, { ContentType, MessageStatus } from '../dataLayer/Message.jsx';
import ChatOrGroup, { chatUser, lastMessageData } from '../dataLayer/ChatOrGroup.jsx';


function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
let ListenChats = null
let ListenMessages = null

function firebaseApis(
    db = getFirestore(firebaseApp),
    usersCollectionName = 'Users',
    keysCollection = 'KeyStore',
    chatsCollectinName = 'Chats'
) {
    return {
        registerUser: (user, privateKey) => {
            return new Promise((resolve, reject) => {
                setDoc(doc(db, usersCollectionName, user.docId), user)
                    .then((response) => {
                        // //console.log("User backend added  successfully", response);
                        return setDoc(doc(db, keysCollection, user.docId), {
                            privateRSAKey: privateKey,
                        })

                    })
                    .then((response) => {
                        // //console.log("User private key added to backend successfully", response);
                        resolve([user, true]);
                    })

                    .catch((error) => {
                        console.error("Error adding user to backedn user", error);
                        reject([error, false]);
                    })


            })

        },

        loginUser: (user) => {
            return new Promise((resolve, reject) => {
                if (user.docId === "garbage") {
                    //console.log("Doc id is garbage");
                    return resolve({ privateEncryptedRSAKey: "", isMigrated: false });
                }

                //console.log("Update started in API", user.docId);
                const userRef = doc(db, usersCollectionName, user.docId);
                //console.log("User ref", userRef);
                const keyRef = doc(db, keysCollection, user.docId);
                //console.log("Key ref", keyRef);
                // Step 1: update FCM
                getDoc(userRef)
                    .then(userSnap => {
                        let privateKey = userSnap.get("privateEncryptedRSAKey") || "";
                        let isMigrated = false;

                        if (!privateKey) {
                            //console.log("Private key missing, fetching backup");
                            return getDoc(keyRef).then(keySnap => {
                                privateKey = keySnap.get("privateRSAKey") || "";
                                isMigrated = true;
                                //console.log("Private key fetched from backup", privateKey);
                                return { privateKey, isMigrated, userSnap };
                            });
                        } else {
                            return { privateKey, isMigrated, userSnap };
                        }
                    })
                    .then(({ privateKey, isMigrated, userSnap }) => {
                        //console.log("Update ended in API");
                        const userData = {
                            username: userSnap.get("username") || "",
                            uniqueId: userSnap.get("uniqueId") || "",
                            profilePic: userSnap.get("profilePic") || "",
                            publicRSAKey: userSnap.get("publicRSAKey"),
                            privateEncryptedRSAKey: privateKey,
                            salt: userSnap.get("salt"),
                            docId: user.docId,
                            isMigrated: isMigrated
                        }
                        resolve(userData);
                    })
                    .catch(error => {
                        console.error("Error in updateUser flow:", error);
                        reject(error);
                    });
            }

            )
        },

        getUserFromUid: (uid) => {
            return new Promise((resolve, reject) => {
                const userRef = doc(db, usersCollectionName, uid)
                getDoc(userRef)
                    .then((userSnap) => {
                        if (!userSnap.exists()) {
                            console.error("No such user!");
                            return reject(new Error("No such user!"));
                        }
                        const userData = {
                            username: userSnap.get("username") || "",
                            uniqueId: userSnap.get("uniqueId") || "",
                            profilePic: userSnap.get("profilePic") || "",
                            publicRSAKey: userSnap.get("publicRSAKey"),
                            privateEncryptedRSAKey: userSnap.get("privateEncryptedRSAKey"),
                            salt: userSnap.get("salt"),
                            docId: uid,
                        }
                        resolve(userData);
                    })
            })

        },

        getSearchUsers: (searchUsername, currentUserName) => {
            //console.log("Started Getting search results api")
            return new Promise((resolve, reject) => {
                const results = [];
                const resultRef = collection(db, usersCollectionName);
                const resultQuery = query(
                    resultRef,
                    where("username", ">=", searchUsername),
                    where("username", "<=", searchUsername + "\uf8ff"),
                    where("username", "!=", currentUserName),
                    limit(10)
                )

                getDocs(resultQuery)
                    .then((snapshot) => {
                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            results.push({
                                username: data.username || "",
                                profilePic: data.profilePic || "",
                            })

                        })
                        resolve(results)
                    })
                    .catch((error) => {
                        console.error("Unable to get the result api : ", error)
                        reject(error)
                    })
            })
        },

        createNewChat: (
            members,
            chatName,
            chatId,
            profilePhoto,
            isGroup = false,
            encryptedAESKeys = AESKeyData(),
            recentMessage
        ) => {
            //console.log("Creating chat started api")
            return new Promise((resolve, reject) => {
                const newChat = {
                    "chatId": chatId,
                    "chatName": chatName,
                    "profilePhoto": profilePhoto,
                    "isGroup": isGroup,
                    "members": members,
                    "lastMessage": [recentMessage, Timestamp.now()],
                    "encryptedAESKeys": encryptedAESKeys
                }
                const newChatRef = doc(db, chatsCollectinName, chatId)
                setDoc(newChatRef, newChat)
                    .then((response) => {
                        resolve(response)
                    })
                    .catch((error) => {
                        console.error("Error creating chat")
                        reject(error)
                    })
            })
        },

        getPublicRSAKeyForMemeber: (listOfMembers) => {
            ////console.log("Started Getting the keys for users", listOfMembers)
            return new Promise((resolve, reject) => {
                const batched = chunkArray(listOfMembers, 10)
                const RSAMemberKeys = []
                const keysRef = collection(db, usersCollectionName)
                const batchPromises = batched.map((batch) => {
                    const keysQuery = query(
                        keysRef,
                        where("username", "in", batch)
                    )
                    return getDocs(keysQuery)
                        .then((keysSnapshot) => {
                            keysSnapshot.docs.forEach(doc => {
                                const data = doc.data();
                                RSAMemberKeys.push({
                                    username: data.username || "",
                                    key: data.publicRSAKey || ""
                                })
                            })
                        })

                })

                Promise.all(batchPromises)
                    .then(() => {
                        resolve(RSAMemberKeys);
                    })
                    .catch((error) => {
                        console.error("Error getting keys", error)
                        reject(error)
                    })
            })
        },

        sendNewMessage: async (
            message = Message(),
            chatId,
            recentMessage
        ) => {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Timeout while sending message")), 5000)
            })

            const sendMessagePromise = (async () => {
                try {
                    const lastMessage = [
                        recentMessage, message.timeStamp, message.senderId
                    ]

                    const messageRef = collection(db, chatsCollectinName, chatId, "Messages")

                    const docRef = await addDoc(messageRef, message)
                    const messageId = docRef.id

                    const chatDataRef = doc(db, chatsCollectinName, chatId)
                    await updateDoc(chatDataRef, { lastMessage })

                    //console.log("Message send successfully and updated chat", messageId)
                    return messageId

                } catch (e) {
                    console.error("Error sending message", e)
                    return ""
                }
            })()

            try {
                return await Promise.race([sendMessagePromise, timeoutPromise])
            }
            catch (e) {
                console.error("Error sending message", e)
                return `${e}`
            }

        },

        getChatData: (chatId, username) => {
            return new Promise((resolve, reject) => {
                //console.log("Getting chatData started")
                const chatDataDoc = doc(db, chatsCollectinName, chatId)
                getDoc(chatDataDoc)
                    .then((chatDoc) => {
                        const chatData = chatDoc.data()
                        const aesKeys = chatData.encryptedAESKeys || null
                        // const arrayTest = []

                        if (aesKeys != null) {
                            //console.log("Got the keys", chatData)
                            const myAeskey = aesKeys.filter((key) =>
                                key.username === username
                            )[0]
                            //console.log("My key in api", myAeskey.username)

                            resolve(
                                ChatOrGroup(
                                    chatId,
                                    chatData.chatName,
                                    chatData.isGroup,
                                    chatData.members,
                                    "",
                                    null,
                                    lastMessageData("", "", ""),
                                    myAeskey.key
                                )
                            )
                        }
                        else {
                            console.error("Unable to get the key")
                            reject(new Error("No key in the chat backend"))
                        }
                    })
            })
        },

        getUserChatData: (username) => {
            //console.log("Called getUserChat Data for ", username)
            return new Promise((resolve, reject) => {
                const userDocument = collection(db, usersCollectionName)
                const userQuery = query(
                    userDocument,
                    where("username", "==", username)
                )
                getDocs(userQuery)
                    .then((userSnapshot) => {
                        const result = userSnapshot.docs[0].data()
                        // //console.log("user chat data",result)
                        resolve(
                            chatUser(
                                result.username,
                                result.fcmToken,
                                result.profilePic
                            )
                        )
                    })
                    .catch((error) => {
                        console.error("Error getting user chatData", error)
                        reject(error)
                    })
            })
        },


        /**
         * 
         * @param {String} username    
         * @param {Boolean} isGroup 
         * @param {(ChatOrGroup)=>{}} onAddChat 
         * @param {(ChatOrGroup)=>{}} onModifiedChat 
         * @param {(ChatOrGroup)=>{}} onDeleteChat 
         * @param {(Error)=>{}} onError 
         */
        getLiveChatsOrGroups:(
            username,
            isGroup,
            onAddChat,
            onModifiedChat,
            onDeleteChat,
            onError
        ) =>{
            if(ListenChats){
                ListenChats()
            }
            else{
                ListenChats = null
            }
            const chatscoll = collection(db, chatsCollectinName)
            const chatsQuery = query(
                chatscoll,
                where("members", "array-contains", username),
                where("isGroup", "==", isGroup)
            )
            try{
                ListenChats = onSnapshot(chatsQuery,
                    (snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added') {
                                // console.log("add chat", change.doc.data())
                                const chatData = change.doc.data()
                                const chatLastMessage = chatData.lastMessage
                                const lastMessage = lastMessageData(
                                    chatLastMessage[2] || "",
                                    chatLastMessage[0],
                                    lastMessageData[1]
                                )
                                const chatAesKey = chatData.encryptedAESKeys
                                const mySecureAesKey = chatAesKey.filter((key) =>
                                    key.username === username
                                )[0]
                                const addChat = ChatOrGroup(
                                    chatData.chatId,
                                    chatData.chatName,
                                    chatData.isGroup,
                                    chatData.members,
                                    chatData.chatPic,
                                    chatData.memberData,
                                    lastMessage,
                                    mySecureAesKey

                                )
                                onAddChat(addChat)
                            }
                            if (change.type === 'modified') {
                                // console.log("modified chat", change.doc.data())
                                const chatData = change.doc.data()
                                const chatLastMessage = chatData.lastMessage
                                const lastMessage = lastMessageData(
                                    chatLastMessage[2] || "",
                                    chatLastMessage[0],
                                    lastMessageData[1]
                                )
                                const chatAesKey = chatData.encryptedAESKeys
                                const mySecureAesKey = chatAesKey.filter((key) =>
                                    key.username === username
                                )[0]
                                const addChat = ChatOrGroup(
                                    chatData.chatId,
                                    chatData.chatName,
                                    chatData.isGroup,
                                    chatData.members,
                                    chatData.chatPic,
                                    chatData.memberData,
                                    lastMessage,
                                    mySecureAesKey

                                )
                                onModifiedChat(addChat)
                            }
                            if (change.type === 'removed') {
                                // console.log("remove chat", change.doc.data())
                                const chatData = change.doc.data()
                                const chatLastMessage = chatData.lastMessage
                                const lastMessage = lastMessageData(
                                    chatLastMessage[2] || "",
                                    chatLastMessage[0],
                                    lastMessageData[1]
                                )
                                const chatAesKey = chatData.encryptedAESKeys
                                const mySecureAesKey = chatAesKey.filter((key) =>
                                    key.username === username
                                )[0]
                                const addChat = ChatOrGroup(
                                    chatData.chatId,
                                    chatData.chatName,
                                    chatData.isGroup,
                                    chatData.members,
                                    chatData.chatPic,
                                    chatData.memberData,
                                    lastMessage,
                                    mySecureAesKey

                                )
                                onDeleteChat(addChat)
                            }
                        })
                    },
                    (error) => {
                        console.error("Unable to start the listening", error)
                        onError(error)
                        ListenChats()
                    }
                )
            }
            catch(error){
                console.error("Error starting listening:",error)
            }
        },

        getLiveMessagesForChat:(
            currentChatId,
            onChange,
            onAdd,
            onError,
            onDelete
        )=>{
            if(ListenMessages){
                ListenMessages()
            }
            else{
                ListenMessages = null
            }

            const messageColl = collection(db,chatsCollectinName,currentChatId,"Messages")
            ListenMessages = onSnapshot(messageColl,
                (snapshot)=>{
                    snapshot.docChanges().forEach((change)=>{
                        const messageData = change.doc.data()
                        const messageId = change.doc.id
                        let messageContentType = ContentType.text
                        switch(messageData.contentType){
                            case "text":
                                messageContentType = ContentType.text
                                break;
                            case "image":
                                messageContentType = ContentType.image
                                break;
                            case "document":
                                messageContentType = ContentType.document
                                break;
                            case "audio":
                                messageContentType = ContentType.audio
                                break;
                            case "video":
                                messageContentType = ContentType.video
                                break;
                            case "deleted":
                                messageContentType = ContentType.deleted
                                break;
                            default:
                                messageContentType = ContentType.default
                            
                        }
                        const messageFromApi = Message(
                            messageId,messageData.content,
                            messageContentType,messageData.senderId,messageData.timeStamp,
                            MessageStatus.Send
                        )

                        switch(change.type){
                            case 'added':
                                onAdd(messageFromApi);
                                break;
                            case 'modified':
                                onChange(messageFromApi);
                                break;
                            case 'removed':
                                onDelete(messageFromApi);
                                break;
                            default:
                                // No action for unknown change type
                                break;
                        }
                    })
                },
                (error)=>{
                    console.error("Unable to start listending",error)
                    onError(error)
                    ListenMessages()
                }
            )
        },

        stopLiveChatOrGroup:(

        )=>{
            if(ListenChats){
                ListenChats()
            }
        },

        stopLiveMessages:(

        )=>{
            if(ListenMessages){
                ListenMessages()
            }
        }

        //delete message and chat remaining to implement.
    }



}

// firebaseApis().getLiveChatsOrGroups(
//     "mrugen@123.com",
//     false,
//     (chat) => {
//         //console.log("Added chat test", chat)
//     },

// )
// firebaseApis().getLiveMessagesForChat(
//     "794831132",
//     (message)=>{
//         //console.log("Message new",message)
//     },
//     (addMessage)=>{
//         //console.log("Messages add",addMessage)
//     }
// )
export default firebaseApis