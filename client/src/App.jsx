import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import QuotesPage from './pages/QuotesPage';
import LogsPage from './pages/LogsPage';
import TodosPage from './pages/TodosPage';
import PostersPage from './pages/PostersPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/posters" element={<PostersPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
