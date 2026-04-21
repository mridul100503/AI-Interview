import React, { use } from 'react'
import {Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import InterviewPage from './pages/InterviewPage'
import InterviewHistory from './pages/InterviewHistory.jsx'
import InterviewReport from './pages/InterviewReport.jsx'
import Pricing from './pages/Pricing'
import { useEffect } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice.js'

export const ServerUrl="http://localhost:8000"

function App() {
  const dispatch=useDispatch();
  useEffect(() => {
    const getUser=async()=>{
      try{
        const result=await axios.get(ServerUrl + "/api/user/current-user",{
          withCredentials:true
        })
        console.log(result.data)
        dispatch(setUserData(result.data))
      }catch(err){
        console.log({message:`failed to get current user ${err}`})
        dispatch(setUserData(null))
      }
    }
    getUser()
  },[dispatch])
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/interview"element={<InterviewPage/>}/>
        <Route path='/history'element={<InterviewHistory/>}/>
        <Route path='/pricing'element={<Pricing/>}/>
        <Route path='/report/:id'element={<InterviewReport/>}/>
      </Routes>
    </div>
  )
}

export default App
