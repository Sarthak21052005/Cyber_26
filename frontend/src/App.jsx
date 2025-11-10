import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import DashBoard from './pages/DashBoard';
import MenuList from './components/Menu/MenuList';
import DineInOrders from './pages/DineInOrders';
import TakeawayOrders from './pages/TakeAwayOrders';
import CreateOrder from './pages/CreateOrder';
import KitchenDisplay from './pages/KitchenDisplay';
import PaymentForm from './components/Payments/PaymentsForm';
import './styles/Global.css';
import './styles/Dashboard.css';
import './styles/Menu.css';
import './styles/Orders.css';
import './styles/Kitchen.css';
import './styles/Forms.css';
import './styles/Components.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DashBoard />} />
            <Route path="/menu" element={<MenuList />} />
            <Route path="/dine-in" element={<DineInOrders />} />
            <Route path="/takeaway" element={<TakeawayOrders />} />
            <Route path="/create-order" element={<CreateOrder />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
            <Route path="/payment/:orderId" element={<PaymentForm />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
