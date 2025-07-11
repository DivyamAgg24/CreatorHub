import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { Landing } from './pages/Landing'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/auth/Login'
import Layout from './layout/Layout'
// import { ThemeProvider } from './context/ThemeContext'
import Register from './pages/auth/Register'
import { Ideas } from './pages/ideas/Ideas'
import { IdeasProvider } from './context/IdeasContext'
import Calendar from './pages/schedule/Scheduler'
import ProtectedRoute from './layout/ProtectedRoute'
import { EventsProvider } from './context/EventsContext'

function App() {

    return (
        <BrowserRouter>
            {/* <ThemeProvider> */}
            <AuthProvider>
                <IdeasProvider>
                    <EventsProvider>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Landing />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/ideas" element={<ProtectedRoute><Ideas /></ProtectedRoute>} />
                                <Route path="/schedule" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                            </Routes>
                        </Layout>
                    </EventsProvider>
                </IdeasProvider>
            </AuthProvider>
            {/* </ThemeProvider> */}
        </BrowserRouter>
    )
}

export default App
