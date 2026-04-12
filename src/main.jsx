import { createRoot } from 'react-dom/client'
import './index.css'
// 🚀 只需要加上这一行，把多语言系统挂载到全局
import './i18n' 
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <App />
)