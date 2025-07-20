import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import firebaseApis from "../firebaseUtils/firebaseApis";
import firebaseApp from '../firebaseUtils/initFirebase.jsx';
import EncryptionService from "./encryptionService.jsx";
import User from "../dataLayer/User.jsx";
import { deleteKeyFromBrowser, getKeyFromBrowser, saveKeyToBrowser } from "./keyStorage.js";
import AESKeyData from "./AESKeyData.jsx";
import Message from "./Message.jsx";
import ChatOrGroup, { chatUser, lastMessageData } from "./ChatOrGroup.jsx";
import { getAesKeyKeyFromBrowser, saveChatAesKeyToBrowser } from "./localChatKeysStorage.js";


function generateSixDigitUUID(n) {
    const uuid = crypto.randomUUID(); // generates a UUID like "123e4567-e89b-12d3-a456-426614174000"
    const hash = Math.abs(hashCode(uuid)).toString();
    return hash.slice(0, n).padStart(6, '0');
}

// Helper to simulate Java's UUID hashCode()
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/**
 * 
 * @param {(ChatOrGroup)=>{}} onChatFunction 
 * @param {apiChat} chatData 
 * @param {browswerKeys} userPrivateKey
 */
function apiChatToOurChat(onChatFunction, chatData, userPrivateKey, myUsername) {
    getAesKeyKeyFromBrowser(chatData.chatId)
        .then((publicKeyObject) => {
            const aesKey = publicKeyObject.decryptedAesKey
            let tempUsername = "chat"
            const memberInfos = Promise.all(chatData.members.map((mem) => {
                if (mem != myUsername) {
                    tempUsername = mem
                }
                firebaseApis().getUserChatData(mem)
                    .then((userInfo) => {
                        return chatUser(
                            userInfo.username,
                            userInfo.fcmToken,
                            userInfo.profilePic
                        )
                    })
            }))
            memberInfos.then(async (memInfos) => {
                let contentEnc = "Unable to decrypt message"
                console.log("Enc content", chatData.lastMessage.content, "Aes key is :", aesKey)
                const aeskeyArrya = EncryptionService.stringToByteArray(aesKey)

                contentEnc = await EncryptionService.aesDecrypt(
                    chatData.lastMessage.content,
                    aeskeyArrya
                )
                const latestChat = ChatOrGroup(
                    chatData.chatId,
                    tempUsername,
                    false,
                    chatData.members,
                    chatData.chatPic,
                    memInfos,
                    lastMessageData(
                        chatData.lastMessage.sender,
                        contentEnc,
                        chatData.lastMessage.timeStamp
                    ),
                    aesKey
                )
                onChatFunction(latestChat)
            })
        })
        .catch((error) => {
            console.warn("Error geting the keys:", error)
            console.log("Data reqd:",chatData.secureAESKey.key)
            const DecryptKeyArray = EncryptionService.decryptAESKeyWithPrivateKey(
                chatData.secureAESKey.key,
                userPrivateKey
            )
            const AesString = EncryptionService.byteArrayToString(DecryptKeyArray)
            const [chatId, chatName] = [chatData.chatId, chatData.chatName]
            saveChatAesKeyToBrowser({
                chatId,
                chatName,
                "decryptedAesKey":AesString
            })

            let tempUsername = "chat"
            const memberInfos = Promise.all(chatData.members.map((mem) => {
                if (mem != myUsername) {
                    tempUsername = mem
                }
                firebaseApis().getUserChatData(mem)
                    .then((userInfo) => {
                        return chatUser(
                            userInfo.username,
                            userInfo.fcmToken,
                            userInfo.profilePic
                        )
                    })
            }))
            memberInfos.then(async (memInfos) => {
                let contentEnc = "Unable to decrypt message"
                const aeskeyArrya = EncryptionService.stringToByteArray(AesString)
                contentEnc = await EncryptionService.aesDecrypt(
                    chatData.lastMessage.content,
                    aeskeyArrya
                )
                const latestChat = ChatOrGroup(
                    chatData.chatId,
                    tempUsername,
                    false,
                    chatData.members,
                    chatData.chatPic,
                    memInfos,
                    lastMessageData(
                        chatData.lastMessage.sender,
                        contentEnc,
                        chatData.lastMessage.timeStamp
                    ),
                    AesString
                )
                onChatFunction(latestChat)
            })
        })
}

function DataRepository(
    networkFirebaseApis = firebaseApis(),
    auth = getAuth(firebaseApp),
) {
    return {
        registerUser: (email, password) => {
            return new Promise((resolve, reject) => {
                try {
                    const { publicKey, privateKey } = EncryptionService.generateRSAKeyPair()

                    createUserWithEmailAndPassword(auth, email, password)
                        .then((userCredential) => {
                            const user = userCredential.user;
                            console.log("User signed up successfully", user);
                            // const publicKey = EncryptionService.publicKeyToString(keypair.publicKey);
                            // const privateKey = EncryptionService.privateKeyToString(keypair.privateKey);
                            const salt = EncryptionService.byteArrayToString(EncryptionService.generateRandomSalt(16));

                            // console.log("Keys generated and ready to be saved", {publicKey, privateKey});
                            const signUpUser = User({
                                username: user.email,
                                uniqueId: generateSixDigitUUID(8),
                                publicRSAKey: publicKey,
                                // privateEncryptedRSAKey: privateKey,
                                salt: salt,
                                docId: user.uid,
                            })

                            //Store keys to browser storage
                            saveKeyToBrowser({
                                keyId: "1",
                                publicKey: publicKey,
                                privateKey: privateKey
                            })
                                .then((browserKeyStatus) => {
                                    networkFirebaseApis.registerUser(signUpUser, privateKey)
                                        .then((response) => {
                                            console.log("User registered successfully", response);
                                            resolve([signUpUser, browserKeyStatus]);
                                        })
                                        .catch((error) => {
                                            console.error("Error registering user", error);
                                            reject([error, false]);
                                        })
                                })
                                .catch((error) => {
                                    console.error("Error saving key to browser", error);
                                    reject([error, false]);
                                })
                            // console.log("Signup user",signUpUser)


                        })
                        .catch((error) => {
                            console.error("Error signing up", error);
                            reject([error, false]);
                        })
                } catch (error) {
                    console.error("Error generating RSA key pair", error);
                    reject([error, false]);
                    return;
                }
                // navigate('/chatApp', { state: user.email }); // Redirect to chatApp with user email
            })


        },

        loginUser: (email, password) => {
            return new Promise((resolve, reject) => {
                signInWithEmailAndPassword(auth, email, password)
                    .then((currentUser) => {
                        console.log("User logged in Successfully datarepository");
                        const user = currentUser.user;
                        const loggedInUser = User({
                            username: user.email,
                            docId: user.uid,
                            password: password,

                        })
                        return networkFirebaseApis.loginUser(loggedInUser)
                    })
                    .then((userLogIn) => {
                        //Add data to browser storage
                        console.log("User logged in successfully saving keys", userLogIn);
                        return [saveKeyToBrowser({
                            keyId: "1",
                            publicKey: userLogIn.publicRSAKey,
                            privateKey: userLogIn.privateEncryptedRSAKey
                        }), userLogIn]

                    })
                    .then(([browserKeyStatus, userLogIn]) => {
                        // console.log("Keys saved to browser storage", browserKeyStatus);
                        browserKeyStatus
                            .then((browserKeyStatus) => {
                                console.log("Keys saved to browser storage", browserKeyStatus);
                                // return {browserKeyStatus, userLogIn}; 
                                resolve([userLogIn, browserKeyStatus])
                            })
                            .catch((error) => {
                                console.error("Error saving keys to browser storage", error);
                                return [error, false];
                            })


                    })
                    .catch((error) => {
                        console.error("Error logging in", error);
                        reject([error, false]);
                    })

            })
        },

        getCurrentUser: () => {
            return new Promise((resolve, reject) => {
                const currentUser = auth.currentUser
                getKeyFromBrowser("1")
                    .then((browswerKeys) => {
                        console.log("Getting key from browser")
                        const curUser = User({
                            username: currentUser.email,
                            docId: currentUser.uid,
                            publicRSAKey: browswerKeys.publicKey,
                            privateEncryptedRSAKey: browswerKeys.privateKey,
                            isMigrated: true
                        })
                        resolve(curUser)
                    })
                    .catch((error) => {
                        console.error("Error getting user", error)
                        reject(error)
                    })
            })
        },

        logoutUser: () => {
            return new Promise((resolve, reject) => {
                deleteKeyFromBrowser("1")
                    .then((status) => {
                        if (status) {
                            return signOut(auth)
                        }

                    })
                    .then((uStatus) => {
                        console.log("User signouted")
                        networkFirebaseApis.stopLiveChatOrGroup()
                        resolve(uStatus)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
        },

        getSearchUsersForChat: (searchUsername, currentUsername) => {
            return new Promise((resolve, reject) => {
                firebaseApis().getSearchUsers(searchUsername, currentUsername)
                    .then((users) => {
                        console.log("Got the results data")
                        resolve(users)
                    })
                    .catch((error) => {
                        console.error("Error getting serch result Datarepo : ", error)
                        reject(error)
                    })
            })
        },

        createNewChatDataRepo: (
            currentUser = User(),
            memberUsers = [],
            chatName,

            profilePhoto,
            isGroup,
        ) => {
            memberUsers.push(currentUser.username)
            console.log("Chat addition started for members,", memberUsers)
            const chatId = generateSixDigitUUID(24)
            return new Promise((resolve, reject) => {
                EncryptionService.generateAESKey()
                    .then((commonAesKey) => {
                        return commonAesKey
                    })
                    .then((commonAesKey) => {
                        return Promise.all([
                            firebaseApis().getPublicRSAKeyForMemeber(memberUsers),
                            Promise.resolve(commonAesKey)
                        ])
                    })
                    .then(async ([publicKeys, commonAesKey]) => {
                        // const array = []
                        // array.map
                        // var publicKeys = []
                        // const AesKeys = []
                        const recentMessageBuffer = await EncryptionService.aesEncrypt(
                            "No Message send, start chatting now!!",
                            commonAesKey
                        )
                        const recentMessageEncrypted = await EncryptionService.byteArrayToString(recentMessageBuffer)
                        console.log("Key data is ", publicKeys)
                        console.log("Some information :", recentMessageEncrypted, commonAesKey)
                        const AesKeys = await Promise.all(
                            publicKeys.map(async (key) => {
                                // console.log(key.username, key.key)
                                const encryptedKeyBytes = await EncryptionService.encryptAESKeyWithPublicKey(
                                    commonAesKey,
                                    EncryptionService.stringToPublicKey(key.key)
                                )
                                return AESKeyData({
                                    username: key.username,
                                    key: EncryptionService.byteArrayToString(
                                        encryptedKeyBytes
                                    )
                                })
                            })
                        )
                        console.log("Adding my key to backend", AesKeys)
                        // const encryptedKeyBytes = await EncryptionService.encryptAESKeyWithPublicKey(
                        //                     commonAesKey,
                        //                     EncryptionService.stringToPublicKey(key.key)
                        //                 )
                        //         const myAeskey = AESKeyData({
                        //             username: key.username,
                        //             key: EncryptionService.byteArrayToString(
                        //                 encryptedKeyBytes
                        //             )
                        //         })

                        firebaseApis().createNewChat(
                            memberUsers, chatName, chatId, profilePhoto, isGroup, AesKeys, recentMessageEncrypted
                        ).then((response) => {
                            console.log("Congratulation you added chat to backend")
                            resolve(response)
                        })

                    })

                    .catch((error) => {
                        console.error("No chat created try again : ", error)
                        reject(error)
                    })
            })

        },

        sendMessage: async (
            message = Message(),
            chatId,
            secureAESKey,

        ) => {
            return new Promise((resolve, reject) => {
                try {
                    const secureAesArray = EncryptionService.stringToByteArray(secureAESKey)
                    EncryptionService.aesEncryptMessages(
                        message.content, secureAesArray
                    )
                        .then((encryptedMessageContent) => {

                            const encryptedMessageString = EncryptionService.byteArrayToString(encryptedMessageContent)
                            const encyMessage = Message(
                                message.messageId, encryptedMessageString, message.contentType, message.senderId
                                , message.timeStamp, message.status
                            )
                            firebaseApis().sendNewMessage(encyMessage, chatId, encryptedMessageString)
                                .then((messageId) => {
                                    console.log("Message id data", messageId)
                                    resolve(messageId)
                                })
                        })
                } catch (e) {
                    console.error("Error sending message datarepo", e)
                    reject(e)

                }
            })

        },

        getDataChat(
            chatId,
            chatName,
        ) {
            return new Promise((resolve, reject) => {
                getKeyFromBrowser("1")
                    .then((privateKey) => {
                        console.log("Got the private key in getDataChat")
                        return Promise.all([
                            firebaseApis().getChatData(chatId, chatName),
                            Promise.resolve(privateKey)
                        ])
                    })
                    .then(([ChatData, privateKey]) => {
                        if (ChatData.isGroup) {
                            console.log("Getting group")
                            const memberData = Promise.all(ChatData.members.map((member) => {
                                return firebaseApis().getUserChatData(member)
                                    .then((memberData) => {
                                        console.log("Data in the calling array", memberData)
                                        return chatUser(
                                            memberData.username,
                                            memberData.fcmToken,
                                            memberData.profilePic
                                        )
                                    })
                            }))
                            console.log("memberdata is ", memberData)
                            memberData
                                .then((memberDataForChat) => {
                                    console.log("Memeber data chat is ", memberDataForChat)
                                    getAesKeyKeyFromBrowser(chatId)
                                        .then((aesKey) => {

                                            console.log("Got key from Idb")
                                            resolve(ChatOrGroup(
                                                chatId,
                                                ChatData.chatName,
                                                ChatData.isGroup,
                                                ChatData.member,
                                                ChatData.chatPic,
                                                memberDataForChat,
                                                ChatData.lastMessage,
                                                aesKey.decryptedAesKey
                                            ))



                                        })
                                        .catch((error) => {
                                            console.error("Error getting key from idb", error)

                                            console.log("no key on idb")


                                            const DecryptKeyArray = EncryptionService.decryptAESKeyWithPrivateKey(
                                                ChatData.secureAESKey,
                                                privateKey
                                            )
                                            const AesString = EncryptionService.byteArrayToString(DecryptKeyArray)
                                            const chatName = ChatData.chatName
                                            saveChatAesKeyToBrowser({
                                                chatId,
                                                chatName,
                                                "decryptedAesKey":AesString
                                            })
                                                .then((response) => {
                                                    console.log("added key to idb,", response)
                                                    resolve(ChatOrGroup(
                                                        chatId,
                                                        ChatData.chatName,
                                                        ChatData.isGroup,
                                                        ChatData.member,
                                                        ChatData.chatPic,
                                                        memberDataForChat,
                                                        ChatData.lastMessage,
                                                        AesString
                                                    ))
                                                })
                                                .catch((error) => {
                                                    console.error("Error setting idb", error)
                                                    reject(error)
                                                })
                                        })
                                })
                        }
                        else {
                            console.log("Getting Chat")
                            var tempChatName = ""
                            const memberData = Promise.all(ChatData.members.map((member) => {
                                if (member != chatName) {
                                    tempChatName = member
                                    return firebaseApis().getUserChatData(member)
                                        .then((memberData) => {
                                            console.log("Data in the calling array", memberData)
                                            return chatUser(
                                                memberData.username,
                                                memberData.fcmToken,
                                                memberData.profilePic
                                            )
                                        })
                                }
                            }))
                            console.log("memberdata is ", memberData)
                            memberData.then((memberDataForChat) => {
                                console.log("Memeber data chat is ", memberDataForChat)
                                getAesKeyKeyFromBrowser(chatId)
                                    .then((aesKey) => {

                                        console.log("Got key from Idb")
                                        resolve(ChatOrGroup(
                                            chatId,
                                            tempChatName,
                                            ChatData.isGroup,
                                            ChatData.member,
                                            ChatData.chatPic,
                                            memberDataForChat,
                                            ChatData.lastMessage,
                                            aesKey.decryptedAesKey
                                        ))
                                    })
                                    .catch((error) => {
                                        console.error("Error getting key from idb Adding them now", error)
                                        console.log("chat data here is", ChatData)
                                        // console.log("Private key is ", privateKey.privateKey)
                                        // console.log("no key on idb")


                                        const DecryptKeyArray = EncryptionService.decryptAESKeyWithPrivateKey(
                                            ChatData.secureAESKey,
                                            privateKey.privateKey
                                        )
                                        const AesString = EncryptionService.byteArrayToString(DecryptKeyArray)
                                        // const chatName = ChatData.chatName
                                        saveChatAesKeyToBrowser({
                                            "chatId": chatId,
                                            "chatName": tempChatName,
                                            "decryptedAesKey": AesString
                                        })
                                            .then((response) => {
                                                console.log("added key to idb,", response)
                                                resolve(ChatOrGroup(
                                                    chatId,
                                                    tempChatName,
                                                    ChatData.isGroup,
                                                    ChatData.member,
                                                    ChatData.chatPic,
                                                    memberDataForChat,
                                                    ChatData.lastMessage,
                                                    AesString
                                                ))

                                            })
                                            .catch((error) => {
                                                console.error("Error setting idb", error)
                                                reject(error)
                                            })
                                        // reject(error)
                                    })
                            })
                        }
                    })
                    .catch((error) => {
                        console.error("Error getting the chatData", error)
                        reject(error)
                    })

            })
        },

        /**
         * 
         * @param {String} myUsername 
         * @param {(ChatOrGroup)=>{}} onChatAdd 
         * @param {(ChatOrGroup)=>{}} onChatUpdate 
         * @param {(ChatOrGroup)=>{}} onChatDelete 
         * @param {(Error)=>{}} onError 
         */
        liveChatStore: (
            myUsername,
            onChatAdd,
            onChatUpdate,
            onChatDelete,
            onError
        ) => {
            getKeyFromBrowser("1")
                .then((privateKey) => {
                    const userPrivateKey = privateKey.privateKey
                    firebaseApis().getLiveChatsOrGroups(
                        myUsername,
                        false,

                        (newChat) => {
                            console.log("Getting live chats data repo")
                            apiChatToOurChat(onChatAdd,newChat,userPrivateKey,myUsername)
                        },
                        (modifiedChat) => {
                           apiChatToOurChat(onChatUpdate,modifiedChat,userPrivateKey,myUsername)
                        },
                        onChatDelete,
                        onError
                    )
                })
        },
        liveGroupStore: (
            myUsername,
            onChatAdd,
            onChatUpdate,
            onChatDelete,
            onError
        ) => {
            getKeyFromBrowser("1")
                .then((privateKey) => {
                    const userPrivateKey = privateKey.privateKey
                    firebaseApis().getLiveChatsOrGroups(
                        myUsername,
                        true,

                        (newChat) => {
                            console.log("Getting live chats data repo")
                            apiChatToOurChat(onChatAdd,newChat,userPrivateKey,myUsername)
                        },
                        (modifiedChat) => {
                           apiChatToOurChat(onChatUpdate,modifiedChat,userPrivateKey,myUsername)
                        },
                        onChatDelete,
                        onError
                    )
                })
        },
        liveMessages:(
            chatId,
            secureAesKey,
            onChange,
            onError,
            onAdd,
            onDelete
        )=>{
            console.log("Getting the messages data")
            firebaseApis().getLiveMessagesForChat(
                chatId,
                async (changeMessage)=>{
                    try{
                        const encryptedContent = changeMessage.content
                        const aeskeyArrya = EncryptionService.stringToByteArray(secureAesKey)
                        const decryptedContent = await EncryptionService.aesDecrypt(
                            encryptedContent,
                            aeskeyArrya
                        )

                        const latestChangeMessage = Message(
                            changeMessage.messageId,
                            decryptedContent,
                            changeMessage.contentType,
                            changeMessage.senderId,
                            changeMessage.timeStamp,
                            changeMessage.status
                        )
                        onChange(latestChangeMessage)
                    }
                    catch(err){
                        console.error("Unable to decryuptthe message",err)
                    }
                },
                async (addMessage)=>{
                    try{
                        const encryptedContent = addMessage.content
                        const aeskeyArrya = EncryptionService.stringToByteArray(secureAesKey)
                        const decryptedContent = await EncryptionService.aesDecrypt(
                            encryptedContent,
                            aeskeyArrya
                        )

                        const latestaddMessage = Message(
                            addMessage.messageId,
                            decryptedContent,
                            addMessage.contentType,
                            addMessage.senderId,
                            addMessage.timeStamp,
                            addMessage.status
                        )
                        onAdd(latestaddMessage)
                    }
                    catch(err){
                        console.error("Unable to decryuptthe chagne message",err)
                    }
                },
                onError,
                async(deleteMessage)=>{
                    try{
                        const encryptedContent = deleteMessage.content
                        const aeskeyArrya = EncryptionService.stringToByteArray(secureAesKey)
                        const decryptedContent = await EncryptionService.aesDecrypt(
                            encryptedContent,
                            aeskeyArrya
                        )

                        const latestdeleteMessage = Message(
                            deleteMessage.messageId,
                            decryptedContent,
                            deleteMessage.contentType,
                            deleteMessage.senderId,
                            deleteMessage.timeStamp,
                            deleteMessage.status
                        )
                        onDelete(latestdeleteMessage)
                    }
                    catch(err){
                        console.error("Unable to decryuptthe message",err)
                    }
                }
            )
        }
    }
}

export default DataRepository;