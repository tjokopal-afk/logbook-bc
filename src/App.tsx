import { Route, Routes, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import Home from "./View/Home";
import LoginPage from "./View/Login/page";
import { Navbar05 } from '@/components/ui/shadcn-io/navbar-05';
import { useAuth } from '@/context/AuthContext';

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
                <Route path="/home" element={<Home />} />
            </Routes>
        </div>
    );
}

export default App;