import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import DashBoard from './pages/DashBoard';
import MenuList from './components/Menu/MenuList';
import CreateOrder from './pages/CreateOrder';
import DineInOrders from './pages/DineInOrders';
import TakeAwayOrders from './pages/TakeAwayOrders';
import KitchenDisplay from './pages/KitchenDisplay';
import './styles/Global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DashBoard />} />
            <Route path="/menu" element={<MenuList />} />
            <Route path="/create-order" element={<CreateOrder />} />
            <Route path="/dine-in" element={<DineInOrders />} />
            <Route path="/takeaway" element={<TakeAwayOrders />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
