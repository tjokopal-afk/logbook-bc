import { Route, Routes } from "react-router";
import Home from "./View/Home";
import { Navbar05 } from '@/components/ui/shadcn-io/navbar-05';

function App() {
    return (
        <div>
            <Navbar05 />
            <Routes>
                <Route path="/" element={<Home />} />
            </Routes>
        </div>
    );
}

export default App;