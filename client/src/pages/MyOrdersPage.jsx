import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API_BASE } from '../config'

// 주문 상태 → 한글 라벨 + 뱃지 색 클래스 (order 모델 status enum 과 1:1)
const STATUS = {
  placed:    { label: '주문접수', cls: 'placed' },
  making:    { label: '제작중',   cls: 'making' },
  shipping:  { label: '배송중',   cls: 'shipping' },
  completed: { label: '완료',     cls: 'completed' },
  cancelled: { label: '취소',     cls: 'cancelled' },
}

// 상태 탭 — 우리 정체성(실물 제작/배송 + 디지털·서비스 즉시완료)에 맞춤
const TABS = [
  { key: 'all',       label: '전체',   match: () => true },
  { key: 'progress',  label: '처리중', match: (s) => s === 'placed' || s === 'making' },
  { key: 'shipping',  label: '배송중', match: (s) => s === 'shipping' },
  { key: 'completed', label: '완료',   match: (s) => s === 'completed' },
  { key: 'cancelled', label: '취소',   match: (s) => s === 'cancelled' },
]

// 내 주문 목록 페이지 — GET /api/orders(getMyOrders)로 내 주문만 불러와 탭별로 보여준다.
function MyOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  // 로그인 확인 + 내 주문 목록 불러오기
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    fetch(API_BASE + '/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { setOrders(data); setLoading(false) })
      .catch(() => navigate('/login'))
  }, [navigate])

  if (loading) {
    return (
      <div className="home"><Navbar />
        <main className="checkout"><p className="product-empty">불러오는 중…</p></main>
      </div>
    )
  }

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0]
  const filtered = orders.filter((o) => activeTab.match(o.status))

  return (
    <div className="home">
      <Navbar />
      <main className="checkout my-orders">
        <h1 className="checkout-title">내 주문 내역</h1>

        {/* 상태 탭 (각 탭에 건수 뱃지) */}
        <div className="mo-tabs">
          {TABS.map((t) => {
            const count = orders.filter((o) => t.match(o.status)).length
            return (
              <button
                key={t.key}
                type="button"
                className={`mo-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}{count > 0 && <span className="mo-tab-count">{count}</span>}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">📦</div>
            <p className="cart-empty-title">해당하는 주문이 없습니다</p>
            <Link to="/" className="btn btn-primary btn-lg">쇼핑하러 가기</Link>
          </div>
        ) : (
          <div className="mo-list">
            {filtered.map((order) => {
              const st = STATUS[order.status] || { label: order.status, cls: '' }
              const items = order.items || []
              const head = items[0]
              const more = items.length - 1
              const totalQty = items.reduce((s, it) => s + it.quantity, 0)
              return (
                <div className="mo-card" key={order._id}>
                  <div className="mo-card-top">
                    <div className="mo-card-head">
                      <span className="mo-order-no">주문 #{order.orderNumber}</span>
                      <span className="mo-order-date">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <span className={`mo-badge ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="mo-card-body">
                    <div className="mo-thumb">
                      {head?.product?.image ? <img src={head.product.image} alt={head.title} /> : <span>이미지</span>}
                    </div>
                    <div className="mo-items">
                      <span className="mo-item-title">
                        {head?.title}{more > 0 ? ` 외 ${more}건` : ''}
                      </span>
                      <span className="mo-item-meta">총 {totalQty}개</span>
                    </div>
                    <span className="mo-amount">{Number(order.finalAmount).toLocaleString('ko-KR')}원</span>
                  </div>

                  {/* 하단 액션 — 강사 '주문 상세보기'를 우리 식으로 (배송추적은 정체성상 생략) */}
                  <div className="mo-card-foot">
                    <Link to={`/orders/${order._id}`} className="mo-detail-btn">주문 상세보기 →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default MyOrdersPage
