import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API_BASE } from '../config'

// 카테고리 코드 → 한글 라벨 (상품 모델 enum 과 1:1)
const CATEGORY_LABEL = {
  office_supply: '사무용품',
  education: '교육콘텐츠',
  auction: '경매 컨설팅',
  coaching: 'AI 과정·코칭',
}

// 주문일 기준 N일 뒤 날짜를 'M월 D일'로 (예상 수령일 계산용)
function fmtAfter(base, addDays) {
  const d = new Date(base)
  d.setDate(d.getDate() + addDays)
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

// 주문 완료 페이지 — 결제 성공 후 navigate(`/orders/:id`)로 들어온다.
// 주문 ID로 백엔드(GET /api/orders/:id)를 다시 조회하므로, 새로고침해도 내용이 유지된다.
function OrderCompletePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 로그인 확인 + 주문 1건 불러오기 (본인 주문만 조회 가능)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch(`${API_BASE}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch(() => {
        setError('주문 정보를 불러올 수 없습니다.')
        setLoading(false)
      })
  }, [id, navigate])

  if (loading) {
    return (
      <div className="home">
        <Navbar />
        <main className="checkout"><p className="product-empty">불러오는 중…</p></main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="home">
        <Navbar />
        <main className="checkout">
          <div className="cart-empty">
            <div className="cart-empty-icon">😢</div>
            <p className="cart-empty-title">{error || '주문을 찾을 수 없습니다.'}</p>
            <Link to="/" className="btn btn-primary btn-lg">홈으로</Link>
          </div>
        </main>
      </div>
    )
  }

  const items = order.items || []
  const hasPhysical = items.some((it) => it.type === 'physical')   // 실물(주문 제작) 포함?
  const hasIntangible = items.some((it) => it.type === 'digital')  // 디지털·서비스 포함?
  const orderedAt = new Date(order.createdAt).toLocaleString('ko-KR')

  // 다음 단계 안내 — 실물(이메일→제작→배송)과 디지털·서비스(이메일→일정안내→즉시이용)를 다르게
  const steps = hasPhysical
    ? [
        { n: 1, title: '주문 확인 이메일', desc: `주문 내역을 ${order.orderer?.email} 로 보내드립니다.` },
        { n: 2, title: '맞춤 제작', desc: '이름·상호에 맞춰 제작합니다. (1~2영업일)' },
        { n: 3, title: '배송', desc: `제작 완료 후 발송 — 예상 수령 ${fmtAfter(order.createdAt, 5)} ~ ${fmtAfter(order.createdAt, 7)}` },
      ]
    : [
        { n: 1, title: '주문 확인 이메일', desc: `주문 내역을 ${order.orderer?.email} 로 보내드립니다.` },
        { n: 2, title: '콘텐츠·일정 안내', desc: '시청·다운로드 링크 또는 코칭·컨설팅 일정을 이메일로 보내드립니다.' },
        { n: 3, title: '바로 이용', desc: '안내받은 링크·일정으로 즉시 이용하실 수 있습니다.' },
      ]

  return (
    <div className="home">
      <Navbar />
      <main className="checkout order-complete">
        {/* 완료 헤더 — 축하 + 주문번호 */}
        <div className="oc-hero">
          <div className="oc-check">✓</div>
          <h1 className="oc-title">주문이 성공적으로 완료되었습니다!</h1>
          <p className="oc-sub">주문해 주셔서 감사합니다. 주문 확인 이메일을 곧 받으실 수 있습니다.</p>
          <div className="oc-orderno">주문번호 <strong>{order.orderNumber}</strong></div>
        </div>

        <div className="checkout-layout">
          {/* 왼쪽: 주문 상품 + 다음 단계 + (실물)배송지 */}
          <div className="checkout-form">
            <section className="checkout-section">
              <h2 className="checkout-section-title">🧾 주문 상품</h2>
              <div className="checkout-items">
                {items.map((it, idx) => (
                  <div className="checkout-item" key={idx}>
                    <div className="checkout-item-thumb">
                      {it.product?.image ? <img src={it.product.image} alt={it.title} /> : <span>이미지</span>}
                    </div>
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{it.title}</span>
                      <span className="checkout-item-meta">
                        {CATEGORY_LABEL[it.product?.category] || ''} · 수량 {it.quantity}개
                      </span>
                    </div>
                    <span className="checkout-item-price">{(it.price * it.quantity).toLocaleString('ko-KR')}원</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 다음 단계 — 강사 디자인 참고, 유형별로 우리 정체성에 맞춤 */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">📋 다음 단계</h2>
              <ol className="oc-steps">
                {steps.map((s) => (
                  <li className="oc-step" key={s.n}>
                    <span className="oc-step-num">{s.n}</span>
                    <div>
                      <p className="oc-step-title">{s.title}</p>
                      <p className="oc-step-desc">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* 실물일 때만 배송지 표시 */}
            {hasPhysical && order.shipping && (
              <section className="checkout-section">
                <h2 className="checkout-section-title">🚚 배송지</h2>
                <p className="oc-address">
                  {order.shipping.recipient} · {order.shipping.phone}<br />
                  {order.shipping.address} {order.shipping.detailAddress}
                  {order.shipping.zipcode ? ` (${order.shipping.zipcode})` : ''}
                </p>
              </section>
            )}
          </div>

          {/* 오른쪽: 결제 정보 요약 */}
          <aside className="checkout-summary">
            <h2 className="cart-summary-title">결제 정보</h2>
            <div className="cart-summary-row"><span>주문일시</span><span>{orderedAt}</span></div>
            <div className="cart-summary-row"><span>결제수단</span><span>{order.payment?.method || '-'}</span></div>
            <div className="cart-summary-row"><span>상품 금액</span><span>{Number(order.totalAmount).toLocaleString('ko-KR')}원</span></div>
            <div className="cart-summary-row">
              <span>배송비</span>
              <span className={order.shippingFee ? '' : 'shipping-free'}>
                {order.shippingFee ? `${order.shippingFee.toLocaleString('ko-KR')}원` : '무료'}
              </span>
            </div>
            <div className="cart-summary-row total"><span>총 결제금액</span><span>{Number(order.finalAmount).toLocaleString('ko-KR')}원</span></div>
            <Link to="/orders" className="btn btn-primary btn-lg checkout-submit">주문 목록 보기</Link>
            <Link to="/" className="cart-continue">계속 쇼핑하기</Link>
          </aside>
        </div>

        {/* 문의 안내 (강사 디자인 참고) */}
        <div className="oc-help">
          <p className="oc-help-title">문의사항이 있으신가요?</p>
          <p className="oc-help-row">📧 support@realtymall.kr · 📞 1600-0000 (평일 10:00~18:00)</p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderCompletePage
