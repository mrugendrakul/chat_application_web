import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import firebaseApis from "../firebaseUtils/firebaseApis";
import firebaseApp from '../firebaseUtils/initFirebase.jsx';
import EncryptionService from "./encryptionService.jsx";
import User from "../dataLayer/User.jsx";
import { deleteKeyFromBrowser, getKeyFromBrowser, saveKeyToBrowser } from "./keyStorage.js";
import { data } from "react-router";
import AESKeyData from "./AESKeyData.jsx";


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
                        resolve(uStatus)
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
            console.log("Chat addition started for members,",memberUsers)
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

        }
    }
}

export default DataRepository;