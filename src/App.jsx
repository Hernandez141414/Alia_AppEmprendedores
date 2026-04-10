import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Entrepreneurs from './pages/Entrepreneurs'
import CreateEntrepreneur from './pages/CreateEntrepreneur'
import Profile from './pages/Profile'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/emprendimientos" element={<Entrepreneurs />} />
        <Route path="/crear" element={<CreateEntrepreneur />} />
        <Route path="/perfil" element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App