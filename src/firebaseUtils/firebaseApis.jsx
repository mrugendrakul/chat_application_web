import { getAuth } from 'firebase/auth';
import firebaseApp from './initFirebase.jsx';
import { doc, getFirestore, setDoc } from 'firebase/firestore';


function firebaseApis(
    db = getFirestore(firebaseApp),
    usersCollection = 'Users',
    keysCollection = 'KeyStore'
){
    return{
        registerUser:(user,privateKey)=>{
            return new Promise(async (resolve,reject)=>{
                await setDoc(doc(db,usersCollection,user.docId),user)
                .then((response)=>{
                    // console.log("User backend added  successfully", response);
                    resolve([user, true]);
                })
                .catch((error)=>{
                    console.error("Error adding user to backedn user", error);
                    reject([error, false]);
                })

                await setDoc(doc(db,keysCollection,user.docId),{
                    privateRSAKey: privateKey,
                })
                .then((response)=>{
                    // console.log("User private key added to backend successfully", response);
                })
                .catch((error)=>{     
                    console.error("Error adding user private key to backend", error);
                    reject([error, false]);
                })
            })
            
        },

        loginUser:()=>{
            return new Promise((resolve,reject)=>{
                
            })
        }
    }

    
        
    
}

export default firebaseApis