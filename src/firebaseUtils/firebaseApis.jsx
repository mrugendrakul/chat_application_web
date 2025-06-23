import { getAuth } from 'firebase/auth';
import firebaseApp from './initFirebase.jsx';
import { arrayUnion, doc, getDoc, getDocFromCache, getFirestore, setDoc, updateDoc } from 'firebase/firestore';


function firebaseApis(
    db = getFirestore(firebaseApp),
    usersCollection = 'Users',
    keysCollection = 'KeyStore'
) {
    return {
        registerUser: (user, privateKey) => {
            return new Promise((resolve, reject) => {
                setDoc(doc(db, usersCollection, user.docId), user)
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

                console.log("Update started in API",user.docId);
                const userRef = doc(db, usersCollection, user.docId);
                console.log("User ref", userRef);
                const keyRef = doc(db, keysCollection, user.docId);
                console.log("Key ref", keyRef);
                // Step 1: update FCM
                updateDoc(userRef, { fcmTokens: arrayUnion("New device : "+user.docId) })
                    .then(() => {
                        console.log("FCM token added");
                        // Step 2: fetch secure keys
                        return getDoc(userRef);
                    })
                    .then(userSnap => {
                        let privateKey = userSnap.get("privateEncryptedRSAKey") || "";
                        let isMigrated = false;

                        if (!privateKey) {
                            console.log("Private key missing, fetching backup");
                            return getDoc(keyRef).then(keySnap => {
                                privateKey = keySnap.get("privateRSAKey") || "";
                                isMigrated = true;
                                console.log("Private key fetched from backup", privateKey);
                                return { privateKey, isMigrated,userSnap };
                            });
                        } else {
                            return { privateKey, isMigrated,userSnap };
                        }
                    })
                    .then(({ privateKey, isMigrated, userSnap }) => {
                        console.log("Update ended in API");
                        const userData = {
                            // username: userSnap.get("username")||"",
                            uniqueId: userSnap.get("uniqueId")||"",
                            profilePic : userSnap.get("profilePic") || "",
                            publicRSAKey: userSnap.get("publicRSAKey"),
                            privateEncryptedRSAKey: privateKey,
                            salt: userSnap.get("salt"),
                            docId: user.docId,
                            isMigrated:isMigrated
                        }
                        resolve( userData );
                    })
                    .catch(error => {
                        console.error("Error in updateUser flow:", error);
                        reject(error);
                    });
            }

            )
        }
    }




}

export default firebaseApis