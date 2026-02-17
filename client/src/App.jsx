import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import QuotesPage from './pages/QuotesPage';
import LogsPage from './pages/LogsPage';
import TodosPage from './pages/TodosPage';
import PostersPage from './pages/PostersPage';
import PricesPage from './pages/PricesPage';
import AdminPage from './pages/AdminPage';
import MapPage from './pages/MapPage';
import RecipesPage from './pages/RecipesPage';
import CraftingPage from './pages/CraftingPage';
import ActivityPage from './pages/ActivityPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/posters" element={<PostersPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/crafting" element={<CraftingPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
