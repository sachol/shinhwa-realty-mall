import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { API_BASE } from '../../config'

// 주문 상태 → 한글 라벨 + 뱃지 색 클래스 (드롭다운 옵션도 이 순서로 만든다)
const STATUS = {
  placed:    { label: '주문접수', cls: 'placed' },
  making:    { label: '제작중',   cls: 'making' },
  shipping:  { label: '배송중',   cls: 'shipping' },
  completed: { label: '완료',     cls: 'completed' },
  cancelled: { label: '취소',     cls: 'cancelled' },
}

// 어드민 상태 탭 — 관리 관점(전체 + 우리 status 5종)
const TABS = [
  { key: 'all',       label: '전체',     match: () => true },
  { key: 'placed',    label: '주문접수', match: (s) => s === 'placed' },
  { key: 'making',    label: '제작중',   match: (s) => s === 'making' },
  { key: 'shipping',  label: '배송중',   match: (s) => s === 'shipping' },
  { key: 'completed', label: '완료',     match: (s) => s === 'completed' },
  { key: 'cancelled', label: '취소',     match: (s) => s === 'cancelled' },
]

const PER_PAGE = 5 // 한 페이지에 보여줄 주문 수

// 어드민 주문 관리 — 관리자만 입장. 전체 주문을 탭·검색·페이지·상태변경으로 관리.
function AdminOrdersPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false) // admin 확인 전엔 화면 숨김
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('') // 주문번호·주문자명·이메일 검색어
  const [page, setPage] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    // 1) 관리자 권한 확인
    fetch(API_BASE + '/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        if (user.user_type !== 'admin') { navigate('/'); return }
        setAllowed(true)
        // 2) 전체 주문 조회 (관리자 전용 API)
        return fetch(API_BASE + '/api/orders/all', { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => { setOrders(data); setLoading(false) })
      })
      .catch(() => navigate('/login'))
  }, [navigate])

  // 주문 상태 변경 — 드롭다운 선택 시 PUT 호출, 성공하면 해당 주문만 새 값으로 교체(불변)
  const handleStatusChange = async (orderId, status) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)))
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (err) {
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 탭/검색이 바뀌면 1페이지로 리셋 (안 그러면 빈 페이지가 보일 수 있음)
  const changeTab = (key) => { setTab(key); setPage(1) }
  const changeQuery = (v) => { setQuery(v); setPage(1) }

  if (!allowed) return null

  if (loading) {
    return (
      <div className="home"><Navbar />
        <main className="checkout"><p className="product-empty">불러오는 중…</p></main>
      </div>
    )
  }

  // 탭 필터 → 검색 필터 순으로 좁힌다
  const activeTab = TABS.find((t) => t.key === tab) || TABS[0]
  const q = query.trim().toLowerCase()
  const filtered = orders
    .filter((o) => activeTab.match(o.status))
    .filter((o) => {
      if (!q) return true
      return (
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.orderer?.name || '').toLowerCase().includes(q) ||
        (o.orderer?.email || '').toLowerCase().includes(q)
      )
    })

  // 페이지네이션 — 현재 페이지에 해당하는 만큼만 잘라서 보여준다
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages) // 필터로 줄어 페이지 초과 시 보정
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div className="home">
      <Navbar />
      <main className="checkout my-orders">
        <div className="admin-orders-head">
          <h1 className="checkout-title">주문 관리</h1>
          <Link to="/admin" className="cart-continue">← 관리자 대시보드</Link>
        </div>

        {/* 검색 바 — 주문번호·주문자명·이메일 즉시 검색 */}
        <div className="ao-search">
          <input
            type="text"
            placeholder="🔍 주문번호 · 주문자명 · 이메일로 검색"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="ao-search-clear" onClick={() => changeQuery('')} aria-label="검색어 지우기">✕</button>
          )}
        </div>

        {/* 상태 탭 (각 탭에 건수) */}
        <div className="mo-tabs">
          {TABS.map((t) => {
            const count = orders.filter((o) => t.match(o.status)).length
            return (
              <button
                key={t.key}
                type="button"
                className={`mo-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => changeTab(t.key)}
              >
                {t.label}{count > 0 && <span className="mo-tab-count">{count}</span>}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">📦</div>
            <p className="cart-empty-title">{q ? '검색 결과가 없습니다' : '해당하는 주문이 없습니다'}</p>
          </div>
        ) : (
          <>
            <div className="mo-list">
              {paged.map((order) => {
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
                        <span className="mo-order-date">{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
                      </div>
                      <span className={`mo-badge ${st.cls}`}>{st.label}</span>
                    </div>

                    {/* 어드민 전용 — 누가 주문했는지(주문자 정보) */}
                    <div className="ao-customer">
                      <span>👤 {order.orderer?.name || '이름 없음'}</span>
                      <span>{order.orderer?.email}</span>
                      {order.orderer?.phone && <span>{order.orderer.phone}</span>}
                    </div>

                    <div className="mo-card-body">
                      <div className="mo-thumb">
                        {head?.product?.image ? <img src={head.product.image} alt={head.title} /> : <span>이미지</span>}
                      </div>
                      <div className="mo-items">
                        <span className="mo-item-title">{head?.title}{more > 0 ? ` 외 ${more}건` : ''}</span>
                        <span className="mo-item-meta">총 {totalQty}개</span>
                      </div>
                      <span className="mo-amount">{Number(order.finalAmount).toLocaleString('ko-KR')}원</span>
                    </div>

                    {/* 하단 — 상태 변경 드롭다운(관리자) + 상세보기 */}
                    <div className="mo-card-foot">
                      <select
                        className="ao-status-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        {Object.entries(STATUS).map(([key, v]) => (
                          <option key={key} value={key}>{v.label}</option>
                        ))}
                      </select>
                      <Link to={`/orders/${order._id}`} className="mo-detail-btn">주문 상세보기 →</Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 페이지네이션 — 5건 초과일 때만 노출 */}
            {totalPages > 1 && (
              <div className="ao-pagination">
                <button type="button" className="page-btn" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>
                  ← 이전
                </button>
                <span className="ao-page-info">{safePage} / {totalPages}</span>
                <button type="button" className="page-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default AdminOrdersPage
