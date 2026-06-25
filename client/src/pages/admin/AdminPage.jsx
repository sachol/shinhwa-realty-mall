import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { API_BASE } from '../../config'

// 주문 상태 → 한글 라벨 + 뱃지 색 클래스 (최근 주문 표시용)
const STATUS = {
  placed:    { label: '주문접수', cls: 'placed' },
  making:    { label: '제작중',   cls: 'making' },
  shipping:  { label: '배송중',   cls: 'shipping' },
  completed: { label: '완료',     cls: 'completed' },
  cancelled: { label: '취소',     cls: 'cancelled' },
}

function AdminPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false) // admin 확인 전엔 화면 숨김
  const [adminName, setAdminName] = useState('')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    // 토큰으로 내 정보 확인 → admin 권한인지 검사 (관리자만 입장)
    fetch(API_BASE + '/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        if (user.user_type !== 'admin') {
          navigate('/') // 관리자가 아니면 메인으로
          return
        }
        setAdminName(user.name)
        setAllowed(true)

        // 통계용 데이터 — 등록 상품 + 전체 주문
        fetch(API_BASE + '/api/products')
          .then((r) => r.json())
          .then((list) => setProducts(list))
          .catch(() => {})
        fetch(API_BASE + '/api/orders/all', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => setOrders(list))
          .catch(() => {})
      })
      .catch(() => navigate('/login'))
  }, [navigate])

  if (!allowed) return null

  // 통계 계산
  const totalOrders = orders.length
  const pending = orders.filter((o) => ['placed', 'making', 'shipping'].includes(o.status)).length // 처리할 주문
  const revenue = orders
    .filter((o) => o.status !== 'cancelled') // 취소 제외한 결제액
    .reduce((sum, o) => sum + (o.finalAmount || 0), 0)
  const recent = orders.slice(0, 5) // 최신순(API가 createdAt desc)

  return (
    <div className="home">
      <Navbar />

      <main className="admin">
        <header className="admin-head">
          <h1 className="admin-title">관리자 대시보드</h1>
          <p className="admin-sub">공인중개사 올인원 관리 시스템에 오신 것을 환영합니다, {adminName}님.</p>
        </header>

        {/* 통계 카드 — 전부 실데이터 */}
        <section className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-label">📦 등록 상품</span>
            <strong className="admin-stat-value">{products.length}개</strong>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-label">🧾 총 주문</span>
            <strong className="admin-stat-value">{totalOrders}건</strong>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-label">⏳ 처리 대기</span>
            <strong className="admin-stat-value">{pending}건</strong>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-label">💰 총 매출</span>
            <strong className="admin-stat-value">{revenue.toLocaleString('ko-KR')}원</strong>
          </div>
        </section>

        {/* 최근 주문 — 관리자가 한눈에 보고 바로 처리로 이동 */}
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-section-title">최근 주문</h2>
            <Link to="/admin/orders" className="admin-panel-more">전체 보기 →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="product-empty">아직 주문이 없습니다.</p>
          ) : (
            <div className="admin-recent">
              {recent.map((o) => {
                const st = STATUS[o.status] || { label: o.status, cls: '' }
                return (
                  <Link to={`/orders/${o._id}`} className="admin-recent-row" key={o._id}>
                    <div className="admin-recent-info">
                      <span className="admin-recent-no">{o.orderNumber}</span>
                      <span className="admin-recent-cust">{o.orderer?.name || '-'} · {new Date(o.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <span className="admin-recent-amount">{Number(o.finalAmount).toLocaleString('ko-KR')}원</span>
                    <span className={`mo-badge ${st.cls}`}>{st.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* 빠른 작업 */}
        <section>
          <h2 className="admin-section-title">빠른 작업</h2>
          <div className="admin-action-list">
            <button type="button" className="admin-action primary" onClick={() => navigate('/admin/products/create')}>
              + 새 상품 등록
            </button>
            <button type="button" className="admin-action" onClick={() => navigate('/admin/orders')}>
              주문 관리
            </button>
            <button type="button" className="admin-action" onClick={() => navigate('/admin/products')}>
              상품 관리
            </button>
            <button type="button" className="admin-action" onClick={() => alert('회원 관리는 준비 중입니다.')}>
              회원 관리
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminPage
