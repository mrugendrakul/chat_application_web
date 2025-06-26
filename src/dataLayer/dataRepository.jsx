import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import firebaseApis from "../firebaseUtils/firebaseApis";
import firebaseApp from '../firebaseUtils/initFirebase.jsx';
import EncryptionService from "./encryptionService.jsx";
import User from "../dataLayer/User.jsx";


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
                    const  {publicKey,privateKey} = EncryptionService.generateRSAKeyPair()

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
                            // console.log("Signup user",signUpUser)
                            networkFirebaseApis.registerUser(signUpUser,privateKey)
                                .then((response) => {
                                    console.log("User registered successfully", response);
                                    resolve([user, signUpUser]);
                                })
                                .catch((error) => {
                                    console.error("Error registering user", error);
                                    reject([error, false]);
                                })

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
                signInWithEmailAndPassword(auth,email,password)
                    .then((currentUser)=>{
                        console.log("User logged in Successfully");
                        const user = currentUser.user;
                        const loggedInUser = User({
                            username:user.email,
                            docId: user.uid,
                            password: password,
                            
                        })
                        return networkFirebaseApis.loginUser(loggedInUser)
                    })
                    .then((userLogIn)=>{
                        //Add data to browser storage
                        console.log("User logged in successfully", userLogIn);
                        resolve(userLogIn);
                    })
                    .catch((error) => {
                        console.error("Error logging in", error);
                        reject([error, false]);
                    })  

            })
        }
    }
}

export default DataRepository;