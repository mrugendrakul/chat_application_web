import React, { useEffect, useState } from 'react'
// import personIcon from './assets/person.svg'
// import visibilityIcon from './assets/visibility.svg'
// import visibilityOffIcon from './assets/visibility_off.svg'
import firebaseApp from './firebaseUtils/initFirebase.jsx'
import { NavLink } from 'react-router'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

import { useNavigate } from 'react-router';

function LoginScreen() {
    const navigate = useNavigate();
    const auth = getAuth(firebaseApp);
    //   onAuthStateChanged(auth,(user)=>{
    //     if(user){
    //       console.log("User is logged in", user);
    //       navigate('/chatApp', {state: user.email}); // Redirect to chatApp with user email
    //     }else{
    //       console.log("No user is logged in");
    //     }
    //   })
    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            console.log("User is already logged in", user);
            navigate('/chatApp', { state: user.email }); // Redirect to chatApp with user email
        }
        else {
            console.log("No user is logged in, you can login now");
        }
    }, [])
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: value
        });
    }

    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };


    const submitForm = (e) => {
        e.preventDefault();
        // console.log("Form Submitted", formData);
        signInWithEmailAndPassword(auth, formData.email, formData.password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("User logged in successfully", user);
                navigate('/chatApp', { state: user.email }); // Redirect to chatApp with user email
            })
            .catch((error) => {
                console.error("Error logging in", error);
                alert("Error logging in: " + error.message);
            });

        setFormData({
            email: "",
            password: ""
        });
    }
    return (
        <div>
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
                <div className="bg-white p-8 rounded-lg shadow-md w-96 dark:bg-gray-900">
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">Login</h2>
                    <form onSubmit={submitForm}>
                        <div className="flex flex-row items-center mb-4">
                            <input
                                type="email"
                                id="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 
                        dark:border-gray-600 dark:text-gray-300"
                                placeholder="Email ID"
                                onChange={handleChange}
                                value={formData.email}
                            />
                            {/* <svg className='svg-inline-block fill-current '>
                    
                </svg> */}
                            <svg height="24px" className='fill-current dark:fill-white' viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-240v-32q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v32q0 33-23.5 56.5T720-160H240q-33 0-56.5-23.5T160-240Zm80 0h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" /></svg>
                        </div>
                        <div className="flex flex-row items-center mb-6">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500
                    dark:border-gray-600 dark:text-gray-300"
                                placeholder="Password"
                                onChange={handleChange}
                                value={formData.password}
                            />
                            <button
                                type="button"
                                className='cursor-pointer'
                                onClick={() => {
                                    console.log("Toggle Password Visibility")
                                    togglePasswordVisibility()
                                }}
                            >
                                {!showPassword ? <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-134 0-244.5-72T61-462q-5-9-7.5-18.5T51-500q0-10 2.5-19.5T61-538q64-118 174.5-190T480-800q134 0 244.5 72T899-538q5 9 7.5 18.5T909-500q0 10-2.5 19.5T899-462q-64 118-174.5 190T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg> : <svg className='mb-0 fill-current dark:fill-white' height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M607-627q29 29 42.5 66t9.5 76q0 15-11 25.5T622-449q-15 0-25.5-10.5T586-485q5-26-3-50t-25-41q-17-17-41-26t-51-4q-15 0-25.5-11T430-643q0-15 10.5-25.5T466-679q38-4 75 9.5t66 42.5Zm-127-93q-19 0-37 1.5t-36 5.5q-17 3-30.5-5T358-742q-5-16 3.5-31t24.5-18q23-5 46.5-7t47.5-2q137 0 250.5 72T904-534q4 8 6 16.5t2 17.5q0 9-1.5 17.5T905-466q-18 40-44.5 75T802-327q-12 11-28 9t-26-16q-10-14-8.5-30.5T753-392q24-23 44-50t35-58q-50-101-144.5-160.5T480-720Zm0 520q-134 0-245-72.5T60-463q-5-8-7.5-17.5T50-500q0-10 2-19t7-18q20-40 46.5-76.5T166-680l-83-84q-11-12-10.5-28.5T84-820q11-11 28-11t28 11l680 680q11 11 11.5 27.5T820-84q-11 11-28 11t-28-11L624-222q-35 11-71 16.5t-73 5.5ZM222-624q-29 26-53 57t-41 67q50 101 144.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" /></svg>}
                            </button>

                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200"
                        >
                            Login
                        </button>
                    </form>
                    <button className='text-blue-500 hover:underline'>
                        <NavLink to="/signup">Don't have an account? Sign Up</NavLink>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LoginScreen