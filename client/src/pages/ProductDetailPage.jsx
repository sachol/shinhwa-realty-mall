import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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

// 상품 종류에 맞는 '이용 안내'를 돌려준다 (디지털·서비스·실물별로 받는 방법이 다름)
function getGuide(product) {
  if (product.category === 'auction') {
    return {
      icon: '📅',
      title: '컨설팅 진행 안내',
      text: '신청 후 이메일로 일정 안내를 드리며, 협의하여 컨설팅 날짜·시간을 확정합니다.',
    }
  }
  if (product.category === 'coaching') {
    return {
      icon: '💬',
      title: '코칭 진행 안내',
      text: '구매 후 이메일로 전용 카카오톡 방을 안내드립니다. 톡방에서 일정과 시간을 함께 정합니다.',
    }
  }
  if (product.type === 'physical') {
    return {
      icon: '🚚',
      title: '배송 안내',
      text: '주문 제작(맞춤) 상품입니다. 결제 후 영업일 기준 5~7일 이내에 배송됩니다.',
    }
  }
  // 그 외 — 디지털 교육콘텐츠(VOD·자료) 등
  return {
    icon: '📧',
    title: '이용 안내',
    text: '구매 후 등록하신 이메일로 시청·다운로드 링크를 보내드립니다.',
  }
}

function ProductDetailPage() {
  const { id } = useParams() // 주소(/products/:id)의 상품 번호
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1) // 담을 수량 (실물만 선택, 디지털·서비스는 1 고정)

  // 페이지가 열릴 때 상품 1개를 불러온다 (로그인 없이 누구나 볼 수 있는 공개 API)
  useEffect(() => {
    fetch(`${API_BASE}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('상품을 찾을 수 없음')
        return res.json()
      })
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

  // ── 불러오는 중 ──
  if (loading) {
    return (
      <div className="home">
        <Navbar />
        <main className="product-detail">
          <p className="product-empty">상품 정보를 불러오는 중입니다…</p>
        </main>
      </div>
    )
  }

  // ── 상품이 없거나 에러 ──
  if (notFound || !product) {
    return (
      <div className="home">
        <Navbar />
        <main className="product-detail">
          <p className="product-empty">상품을 찾을 수 없습니다.</p>
          <div className="detail-back-wrap">
            <Link to="/" className="btn btn-primary">메인으로 돌아가기</Link>
          </div>
        </main>
      </div>
    )
  }

  // ── 정상: 화면에 보여줄 값 정리 ──
  const isDigital = product.type === 'digital'
  const price = Number(product.price).toLocaleString('ko-KR') // 천 단위 콤마
  const categoryLabel = CATEGORY_LABEL[product.category] || product.category
  const guide = getGuide(product) // 이 상품 종류에 맞는 이용 안내

  // 장바구니 담기 — 로그인 필요. 성공하면 Navbar 뱃지에 '담았다' 신호를 보낸다.
  const handleAddToCart = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }
    try {
      const res = await fetch(API_BASE + '/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity: qty }),
      })
      const data = await res.json()
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated')) // Navbar 개수 갱신 신호
        // 디지털·서비스를 이미 담은 경우엔 다른 안내 (중복 누적 방지)
        const message = data.alreadyAdded
          ? '이미 장바구니에 담긴 상품입니다. 🛒\n장바구니로 이동할까요?'
          : '장바구니에 담았습니다! 🛒\n장바구니로 이동할까요?'
        if (window.confirm(message)) {
          navigate('/cart')
        }
      } else {
        alert('담기 실패: ' + (data.message || '다시 시도해 주세요.'))
      }
    } catch (err) {
      alert('서버에 연결할 수 없습니다.')
    }
  }

  return (
    <div className="home">
      <Navbar />

      <main className="product-detail">
        {/* 현재 위치 (홈 / 카테고리 / 상품명) */}
        <nav className="detail-breadcrumb" aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span aria-hidden="true">/</span>
          <span>{categoryLabel}</span>
          <span aria-hidden="true">/</span>
          <span className="detail-breadcrumb-current">{product.title}</span>
        </nav>

        <div className="detail-grid">
          {/* 왼쪽: 상품 이미지 + 실물/디지털 시그니처 뱃지 */}
          <div className="detail-image">
            {product.image ? (
              <img src={product.image} alt={product.title} />
            ) : (
              <div className="detail-noimg">이미지 준비 중</div>
            )}
            <span className={`type-badge ${isDigital ? 'digital' : 'physical'}`}>
              {isDigital ? '디지털' : '실물'}
            </span>
          </div>

          {/* 오른쪽: 상품 정보 */}
          <div className="detail-info">
            <span className="category-pill">{categoryLabel}</span>
            <h1 className="detail-title">{product.title}</h1>
            <p className="detail-sku">SKU: {product.sku}</p>

            <p className="detail-price">
              {price}<span>원</span>
            </p>

            {/* 이용/제작 상태 — 디지털은 즉시 이용, 실물은 주문 제작 */}
            <div className="detail-stock">
              {isDigital ? (
                <span className="stock-ok">디지털 상품 · 즉시 이용 가능</span>
              ) : (
                <span className="stock-ok">주문 제작 상품 · 맞춤 제작 후 배송</span>
              )}
            </div>

            {/* 상품 설명 */}
            <div className="detail-desc">
              <h2 className="detail-desc-title">상품 설명</h2>
              <p>{product.description ? product.description : '등록된 설명이 없습니다.'}</p>
            </div>

            {/* 이용 안내 — 카테고리·유형별 자동 표시 */}
            <div className="detail-guide">
              <span className="detail-guide-icon">{guide.icon}</span>
              <div>
                <p className="detail-guide-title">{guide.title}</p>
                <p className="detail-guide-text">{guide.text}</p>
              </div>
            </div>

            {/* 수량 선택 — 실물(주문 제작)만, 디지털·서비스는 1개 고정 */}
            {!isDigital && (
              <div className="detail-qty">
                <span className="detail-qty-label">수량</span>
                <div className="qty-control">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                    −
                  </button>
                  <span className="qty-value">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
                </div>
              </div>
            )}

            {/* 동선 버튼 — 장바구니 담기 + 목록으로 */}
            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
              >
                🛒 장바구니 담기
              </button>
              <Link to="/" className="btn btn-ghost btn-lg">← 목록으로</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetailPage
