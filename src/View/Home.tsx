import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">Sistem Rekomendasi Training Terbaik</h1>
        <p className="text-lg text-gray-700">Menggabungkan Sistem Penunjang Keputusan dengan Machine Learning</p>
        <Button className = "mt-4" onClick={() => navigate("/dashboard")}>Cek Sekarang</Button>
      </div>

    </>
  )
}

export default Home;
