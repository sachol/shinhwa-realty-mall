import { Routes, Route } from 'react-router-dom'
import './App.css'
import MainPage from './pages/MainPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderCompletePage from './pages/OrderCompletePage'
import MyOrdersPage from './pages/MyOrdersPage'
// 관리자(admin) 권한 페이지 — pages/admin/ 으로 모음
import AdminPage from './pages/admin/AdminPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import ProductCreatePage from './pages/admin/ProductCreatePage'
import ProductEditPage from './pages/admin/ProductEditPage'

function App() {
  // 주소(/)에 따라 어떤 페이지를 보여줄지 연결하는 '길 지도'
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />          {/* 메인 페이지 */}
      <Route path="/products/:id" element={<ProductDetailPage />} /> {/* 상품 상세 (누구나) */}
      <Route path="/cart" element={<CartPage />} />        {/* 장바구니 (로그인 필요) */}
      <Route path="/checkout" element={<CheckoutPage />} /> {/* 주문하기 (로그인 필요) */}
      <Route path="/orders" element={<MyOrdersPage />} />          {/* 내 주문 목록 (로그인 필요) */}
      <Route path="/orders/:id" element={<OrderCompletePage />} /> {/* 주문 완료/상세 (로그인 필요) */}
      <Route path="/login" element={<LoginPage />} />      {/* 로그인 페이지 */}
      <Route path="/signup" element={<RegisterPage />} />  {/* 회원가입 페이지 */}
      {/* ── 관리자 전용 ── */}
      <Route path="/admin" element={<AdminPage />} />      {/* 관리자 대시보드 */}
      <Route path="/admin/orders" element={<AdminOrdersPage />} /> {/* 관리자 주문 관리 */}
      <Route path="/admin/products" element={<AdminProductsPage />} />        {/* 상품 관리 목록 */}
      <Route path="/admin/products/create" element={<ProductCreatePage />} /> {/* 상품 등록 */}
      <Route path="/admin/products/:id/edit" element={<ProductEditPage />} /> {/* 상품 수정 */}
    </Routes>
  )
}

export default App
