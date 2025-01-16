import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import { Protectedroutes } from './utils/Protectedrouts'
import Project from './pages/Project'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protectedroutes />}>
      <Route path="/" element={<Home />} />
      <Route path="/project/:name" element={<Project />} />
      </Route>
    </Routes>
    </BrowserRouter>
  </StrictMode>,
)
