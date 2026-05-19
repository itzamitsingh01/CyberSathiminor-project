import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

axios.defaults.baseURL = import.meta.env.MODE === 'production' 
  ? 'https://cybersathi-0wqe.onrender.com/api' 
  : 'http://localhost:5000/api';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
