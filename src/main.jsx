import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes,Route } from 'react-router'
import './index.css'
import App from './App.jsx'
import LoginScreen from './Pages/LoginScreen.jsx'
import SignupScreen from './Pages/SignupScreen.jsx'
import MainChatApp from './MainChatApp.jsx'
import { Buffer } from 'buffer';
import MainWindow from './Pages/MainWindow.jsx'
window.Buffer = Buffer;


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path = '/' element={<App />} />
      <Route path='/login' element = {<LoginScreen/>}/>
      <Route path='/signup' element = {<SignupScreen/>}/>
      <Route path='/testingSide' element = {<MainChatApp/>}/>
      <Route path='chatApp' element = {<MainWindow/>}/>
      <Route path='*' element={<h1>404 Not Found</h1>} />
    </Routes>
      
    </BrowserRouter>
    
     
  </StrictMode>,
)
