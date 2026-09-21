import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
      <BrowserRouter>
        <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(20, 20, 30, 0.9)',
            backdropFilter: 'blur(20px)',
            color: '#e8e8ec',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#8B5CF6', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EC4899', secondary: '#fff' },
          },
        }}
      />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
