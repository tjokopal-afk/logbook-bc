import { Route, Routes, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import Home from "./View/Home";
import LoginPage from "./View/Login/page";
import { Navbar05 } from '@/components/ui/shadcn-io/navbar-05';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfilePage from './View/Profile/ProfilePage'
import EditProfile from './View/Profile/EditProfile'

// Minimal placeholder pages for other features (to be expanded)
const Projects = () => <div className='p-6'>Projects list (TODO)</div>
const Tasks = () => <div className='p-6'>Tasks (TODO)</div>
const Logbook = () => <div className='p-6'>Logbook entries (TODO)</div>
const Reviews = () => <div className='p-6'>Reviews & Ratings (TODO)</div>
const AuditLog = () => <div className='p-6'>Audit Log (admin only) (TODO)</div>

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user && location.pathname === '/') {
            navigate('/home', { replace: true });
        }
        // If user is not logged in and is trying to access any protected route, send to login
        if (!user && location.pathname !== '/') {
            navigate('/', { replace: true });
        }
    }, [user, location.pathname, navigate]);

    return (
        <div>
                {location.pathname !== '/' && <Navbar05 />}
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                    <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/logbook" element={<ProtectedRoute><Logbook /></ProtectedRoute>} />
                    <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
                    <Route path="/audit" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
                </Routes>
            </div>
    );
}

export default App;