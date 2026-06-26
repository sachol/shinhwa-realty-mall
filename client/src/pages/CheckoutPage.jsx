import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API_BASE } from '../config'

// 결제 수단 (선택값은 주문에 기록) — 테스트 결제창은 'card'로 통일한다
const PAY_METHODS = ['신용카드', '계좌이체', '카카오페이', '네이버페이']

function CheckoutPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 입력값 — 주문자 / 배송지 / 요청사항
  const [orderer, setOrderer] = useState({ name: '', email: '', phone: '' })
  const [shipping, setShipping] = useState({
    recipient: '', phone: '', address: '', detailAddress: '', zipcode: '',
  })
  const [memo, setMemo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('신용카드') // 결제 수단 (기본: 신용카드)

  // 로그인 확인 + 내 정보(주문자 기본값) + 장바구니(주문 요약) 불러오기
  // (V2 SDK는 별도 초기화 없이 PortOne.requestPayment 호출 시 storeId·channelKey로 동작)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    // 내 정보로 주문자 이름·이메일 미리 채우기 (편의)
    fetch(API_BASE + '/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => { if (me) setOrderer((p) => ({ ...p, name: me.name || '', email: me.email || '' })) })
      .catch(() => {})

    // 장바구니 (주문 요약용)
    fetch(API_BASE + '/api/cart', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { setCart(data); setLoading(false) })
      .catch(() => navigate('/login'))
  }, [navigate])

  if (loading) {
    return (
      <div className="home"><Navbar />
        <main className="checkout"><p className="product-empty">불러오는 중…</p></main>
      </div>
    )
  }

  const items = (cart?.items || []).filter((it) => it.product)

  // 장바구니가 비었으면 주문 불가
  if (items.length === 0) {
    return (
      <div className="home"><Navbar />
        <main className="checkout">
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p className="cart-empty-title">주문할 상품이 없습니다</p>
            <Link to="/" className="btn btn-primary btn-lg">쇼핑하러 가기</Link>
          </div>
        </main>
      </div>
    )
  }

  // 금액 계산 — 실물은 주문제작·개별포장이므로 배송비 '개당 3,000원'(= 실물 총수량 × 3,000)
  const hasPhysical = items.some((it) => it.product.type === 'physical')
  const physicalQty = items.filter((it) => it.product.type === 'physical').reduce((s, it) => s + it.quantity, 0)
  const totalAmount = cart.totalAmount || 0
  const shippingFee = physicalQty * 3000
  const finalAmount = totalAmount + shippingFee

  const handleOrderer = (e) => setOrderer({ ...orderer, [e.target.name]: e.target.value })
  const handleShipping = (e) => setShipping({ ...shipping, [e.target.name]: e.target.value })

  // 주문하기 — ① 포트원 V2 결제창 → ② 결제 성공 → ③ 주문 생성(결제완료). 강사 강조: 결제 확인 후 생성
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orderer.name || !orderer.email) {
      alert('주문자 이름과 이메일을 입력해 주세요.'); return
    }
    if (hasPhysical && (!shipping.recipient || !shipping.address)) {
      alert('실물 상품은 받는 분과 주소를 입력해 주세요.'); return
    }
    if (!window.PortOne) {
      alert('결제 모듈이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.'); return
    }
    const token = localStorage.getItem('token')
    // 결제 식별번호 — 이 번호로 결제하고, 성공하면 같은 번호로 주문을 만든다 (예: ORD-20260622-143052)
    const now = new Date()
    const p = (n) => String(n).padStart(2, '0')
    const paymentId = `ORD-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
    const orderName = items[0].product.title + (items.length > 1 ? ` 외 ${items.length - 1}건` : '')

    setSubmitting(true)
    try {
      // ① 포트원 V2 결제창 호출 (결제에 성공해야 주문이 생성됨 — 유령 주문 방지)
      const response = await window.PortOne.requestPayment({
        storeId: import.meta.env.VITE_PORTONE_STORE_ID,
        channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
        paymentId,
        orderName,
        totalAmount: Math.max(100, finalAmount), // 최소 100원 보장
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD', // 테스트 안정을 위해 카드로 통일 (선택 수단은 주문에 기록됨)
        customer: {
          fullName: orderer.name,
          email: orderer.email,
          phoneNumber: orderer.phone || '010-0000-0000',
        },
      })

      // ② 결제 실패/취소 — response.code 가 있으면 실패
      if (response.code !== undefined) {
        alert('결제가 취소되었거나 실패했습니다.\n' + (response.message || ''))
        setSubmitting(false)
        return
      }

      // ③ 결제 성공 → 주문 생성 (결제완료 상태). 백엔드가 더블주문·결제 확인 후 생성
      const res = await fetch(API_BASE + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderer,
          shipping: hasPhysical ? shipping : undefined,
          memo,
          paymentMethod,
          orderNumber: paymentId,
          impUid: response.paymentId, // 포트원 결제 식별자
        }),
      })
      const order = await res.json()
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated')) // Navbar 장바구니 뱃지 갱신
        navigate(`/orders/${order._id}`) // 주문 완료 페이지로 이동 (주문 ID로 조회해 표시)
      } else {
        alert('결제는 완료됐지만 주문 생성에 실패했습니다.\n' + (order.message || '') + '\n고객센터로 문의해 주세요.')
      }
    } catch (err) {
      alert('결제 처리 중 오류가 발생했습니다.\n' + (err.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="home">
      <Navbar />
      <main className="checkout">
        <h1 className="checkout-title">주문하기</h1>

        <form className="checkout-layout" onSubmit={handleSubmit}>
          {/* 왼쪽: 입력 */}
          <div className="checkout-form">
            {/* 주문자 정보 */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">주문자 정보</h2>
              <label className="auth-label">이름
                <input type="text" name="name" value={orderer.name} onChange={handleOrderer} required />
              </label>
              <label className="auth-label">
                이메일 <span className="label-hint">(상품·영수증을 받을 주소)</span>
                <input type="email" name="email" value={orderer.email} onChange={handleOrderer} required />
              </label>
              <label className="auth-label">연락처
                <input type="tel" name="phone" value={orderer.phone} onChange={handleOrderer} placeholder="010-0000-0000" />
              </label>
            </section>

            {/* 배송 정보 — 실물 있을 때만 / 아니면 전달 방법 안내 */}
            {hasPhysical ? (
              <section className="checkout-section">
                <h2 className="checkout-section-title">🚚 배송 정보</h2>
                <label className="auth-label">받는 분
                  <input type="text" name="recipient" value={shipping.recipient} onChange={handleShipping} required />
                </label>
                <label className="auth-label">연락처
                  <input type="tel" name="phone" value={shipping.phone} onChange={handleShipping} placeholder="010-0000-0000" />
                </label>
                <label className="auth-label">주소
                  <input type="text" name="address" value={shipping.address} onChange={handleShipping} placeholder="도로명·지번 주소" required />
                </label>
                <label className="auth-label">상세 주소
                  <input type="text" name="detailAddress" value={shipping.detailAddress} onChange={handleShipping} placeholder="동·호수 등" />
                </label>
                <label className="auth-label">우편번호
                  <input type="text" name="zipcode" value={shipping.zipcode} onChange={handleShipping} />
                </label>
              </section>
            ) : (
              <section className="checkout-section">
                <h2 className="checkout-section-title">📧 전달 방법</h2>
                <p className="checkout-note">
                  디지털·서비스 상품은 배송이 없습니다. <strong>주문자 이메일</strong>로 시청·다운로드 링크 또는 일정 안내를 보내드립니다.
                </p>
              </section>
            )}

            {/* 요청사항 */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">요청사항 <span className="label-hint">(선택)</span></h2>
              <textarea
                className="checkout-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="명함·도장 등 맞춤 제작 정보(이름·상호)나 배송 요청을 적어 주세요."
                rows="3"
              />
            </section>

            {/* 결제 방법 — 선택값은 주문에 저장, 실제 결제창은 다음 단계(KG) */}
            <section className="checkout-section">
              <h2 className="checkout-section-title">💳 결제 방법</h2>
              <div className="pay-methods">
                {PAY_METHODS.map((m) => (
                  <label key={m} className={`pay-method ${paymentMethod === m ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m}
                      checked={paymentMethod === m}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* 오른쪽: 주문 요약 */}
          <aside className="checkout-summary">
            <h2 className="cart-summary-title">주문 요약</h2>
            <div className="checkout-items">
              {items.map((it) => (
                <div className="checkout-item" key={it._id}>
                  <div className="checkout-item-thumb">
                    {it.product.image ? <img src={it.product.image} alt={it.product.title} /> : <span>이미지</span>}
                  </div>
                  <div className="checkout-item-info">
                    <span className="checkout-item-name">{it.product.title}</span>
                    <span className="checkout-item-meta">수량 {it.quantity}개</span>
                  </div>
                  <span className="checkout-item-price">{(it.price * it.quantity).toLocaleString('ko-KR')}원</span>
                </div>
              ))}
            </div>
            <div className="cart-summary-row"><span>상품 금액</span><span>{totalAmount.toLocaleString('ko-KR')}원</span></div>
            <div className="cart-summary-row">
              <span>배송비{physicalQty > 0 ? ' (개당 3,000원)' : ''}</span>
              <span className={shippingFee === 0 ? 'shipping-free' : ''}>
                {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString('ko-KR')}원`}
              </span>
            </div>
            <div className="cart-summary-row total"><span>총 결제금액</span><span>{finalAmount.toLocaleString('ko-KR')}원</span></div>
            <button type="submit" className="btn btn-primary btn-lg checkout-submit" disabled={submitting}>
              {submitting ? '처리 중…' : `${finalAmount.toLocaleString('ko-KR')}원 주문하기`}
            </button>
            <Link to="/cart" className="cart-continue">← 장바구니로</Link>
          </aside>
        </form>
      </main>

      <Footer />
    </div>
  )
}

export default CheckoutPage
