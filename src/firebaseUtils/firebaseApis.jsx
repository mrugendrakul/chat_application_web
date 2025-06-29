import { getAuth } from 'firebase/auth';
import firebaseApp from './initFirebase.jsx';
import { addDoc, arrayUnion, collection, doc, getDoc, getDocFromCache, getDocs, getFirestore, limit, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import AESKeyData from '../dataLayer/AESKeyData.jsx';
import Message from '../dataLayer/Message.jsx';


function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}


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
                        // console.log("User backend added  successfully", response);
                        return setDoc(doc(db, keysCollection, user.docId), {
                            privateRSAKey: privateKey,
                        })

                    })
                    .then((response) => {
                        // console.log("User private key added to backend successfully", response);
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
                    console.log("Doc id is garbage");
                    return resolve({ privateEncryptedRSAKey: "", isMigrated: false });
                }

                console.log("Update started in API", user.docId);
                const userRef = doc(db, usersCollectionName, user.docId);
                console.log("User ref", userRef);
                const keyRef = doc(db, keysCollection, user.docId);
                console.log("Key ref", keyRef);
                // Step 1: update FCM
                getDoc(userRef)
                    .then(userSnap => {
                        let privateKey = userSnap.get("privateEncryptedRSAKey") || "";
                        let isMigrated = false;

                        if (!privateKey) {
                            console.log("Private key missing, fetching backup");
                            return getDoc(keyRef).then(keySnap => {
                                privateKey = keySnap.get("privateRSAKey") || "";
                                isMigrated = true;
                                console.log("Private key fetched from backup", privateKey);
                                return { privateKey, isMigrated, userSnap };
                            });
                        } else {
                            return { privateKey, isMigrated, userSnap };
                        }
                    })
                    .then(({ privateKey, isMigrated, userSnap }) => {
                        console.log("Update ended in API");
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
            console.log("Started Getting search results api")
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
            console.log("Creating chat started api")
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
            console.log("Started Getting the keys for users", listOfMembers)
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

                    const messageRef = collection(db,chatsCollectinName,chatId,"Messages")

                    const docRef = await addDoc(messageRef,message)
                    const messageId = docRef.id

                    const chatDataRef = doc(db,chatsCollectinName,chatId)
                    await updateDoc(chatDataRef,{lastMessage})

                    console.log("Message send successfully and updated chat",messageId)
                    return messageId

                } catch (e) {
                    console.error("Error sending message", e)
                    return ""
                }
            })()

            try{
                return await Promise.race([sendMessagePromise,timeoutPromise])
            }
            catch(e){
                console.error("Error sending message",e)
                return `${e}`
            }

        }
    }




}

export default firebaseApis