import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: 페이지 이동(라우팅)을 켜는 스위치 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
