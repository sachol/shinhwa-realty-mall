import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API_BASE } from '../config'

// 카테고리 코드 → 한글 라벨 (상품 모델의 enum 값과 1:1로 맞춤)
const CATEGORY_LABEL = {
  office_supply: '사무용품',
  education: '교육콘텐츠',
  auction: '경매 컨설팅',
  coaching: 'AI 과정·코칭',
}

function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  // 내 장바구니 불러오기 (로그인 필요)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch(API_BASE + '/api/cart', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setCart(data)
        setLoading(false)
      })
      .catch(() => navigate('/login'))
  }, [navigate])

  // 수량 변경 (PUT) — 성공하면 화면과 Navbar 뱃지를 함께 갱신
  const handleQuantity = async (itemId, quantity) => {
    if (quantity < 1) return // 1개 미만은 무시 (빼려면 삭제 버튼)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:5000/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity }),
      })
      if (res.ok) {
        setCart(await res.json())
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (err) {
      alert('수량 변경에 실패했습니다.')
    }
  }

  // 항목 삭제 (DELETE)
  const handleRemove = async (itemId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:5000/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCart(await res.json())
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (err) {
      alert('삭제에 실패했습니다.')
    }
  }

  // 장바구니 통째로 비우기 (DELETE /api/cart)
  const handleClear = async () => {
    if (!window.confirm('장바구니를 모두 비울까요?')) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(API_BASE + '/api/cart', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCart(await res.json())
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (err) {
      alert('비우기에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="home">
        <Navbar />
        <main className="cart-page">
          <p className="product-empty">불러오는 중…</p>
        </main>
      </div>
    )
  }

  const items = cart?.items || []
  // 실물(physical) 상품이 하나라도 있으면 배송비 3,000원 — 디지털(VOD·다운로드)만이면 무료
  const SHIPPING_FEE = 3000
  const hasPhysical = items.some((it) => it.product?.type === 'physical')
  const shippingFee = hasPhysical ? SHIPPING_FEE : 0
  const finalAmount = (cart?.totalAmount || 0) + shippingFee

  return (
    <div className="home">
      <Navbar />

      <main className="cart-page">
        <div className="cart-head">
          <h1 className="cart-title">🛒 장바구니</h1>
          {items.length > 0 && (
            <button type="button" className="cart-clear" onClick={handleClear}>
              장바구니 비우기
            </button>
          )}
        </div>

        {items.length === 0 ? (
          // ── 빈 장바구니 ──
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p className="cart-empty-title">장바구니가 비어있습니다</p>
            <p className="cart-empty-sub">마음에 드는 상품을 장바구니에 담아보세요!</p>
            <Link to="/" className="btn btn-primary btn-lg">쇼핑 계속하기</Link>
          </div>
        ) : (
          // ── 담긴 상품 목록 + 요약 ──
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => {
                const p = item.product
                if (!p) return null // 상품이 삭제된 경우 방어
                const isDigital = p.type === 'digital'
                return (
                  <div className="cart-item" key={item._id}>
                    <div className="cart-item-thumb">
                      {p.image ? <img src={p.image} alt={p.title} /> : <span>이미지</span>}
                    </div>

                    <div className="cart-item-info">
                      <span className={`type-badge-sm ${isDigital ? 'digital' : 'physical'}`}>
                        {isDigital ? '디지털' : '실물'}
                      </span>
                      <Link to={`/products/${p._id}`} className="cart-item-name">{p.title}</Link>
                      <span className="cart-item-cat">{CATEGORY_LABEL[p.category] || p.category}</span>
                    </div>

                    {isDigital ? (
                      // 디지털·서비스는 수량 고정(1개) — 조절 버튼 없음
                      <div className="cart-item-qty">
                        <span className="qty-fixed">1개</span>
                      </div>
                    ) : (
                      // 실물만 수량 조절 가능
                      <div className="cart-item-qty">
                        <button
                          type="button"
                          onClick={() => handleQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => handleQuantity(item._id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    )}

                    <div className="cart-item-price">
                      {(item.price * item.quantity).toLocaleString('ko-KR')}원
                    </div>

                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => handleRemove(item._id)}
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <aside className="cart-summary">
              <h2 className="cart-summary-title">주문 요약</h2>
              <div className="cart-summary-row">
                <span>총 수량</span>
                <span>{cart.totalItems}개</span>
              </div>
              <div className="cart-summary-row">
                <span>상품 금액</span>
                <span>{Number(cart.totalAmount).toLocaleString('ko-KR')}원</span>
              </div>
              <div className="cart-summary-row">
                <span>배송비</span>
                <span className={shippingFee === 0 ? 'shipping-free' : ''}>
                  {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString('ko-KR')}원`}
                </span>
              </div>
              <div className="cart-summary-row total">
                <span>총 결제금액</span>
                <span>{finalAmount.toLocaleString('ko-KR')}원</span>
              </div>
              {shippingFee === 0 ? (
                <p className="shipping-note">디지털 상품만 담겨 있어 배송비가 없습니다.</p>
              ) : (
                <p className="shipping-note">실물 상품 배송비 3,000원이 포함되었습니다.</p>
              )}
              <button
                type="button"
                className="btn btn-primary btn-lg cart-checkout"
                onClick={() => navigate('/checkout')}
              >
                주문하기
              </button>
              <Link to="/" className="cart-continue">← 쇼핑 계속하기</Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default CartPage
