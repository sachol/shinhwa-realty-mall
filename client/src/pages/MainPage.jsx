import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { API_BASE } from '../config'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

const PAGE_SIZE = 4 // 한 페이지에 보여줄 상품 개수

// 카테고리 바로가기 (상품 모델 category enum 과 1:1)
const CATEGORIES = [
  { key: 'office_supply', icon: '📋', label: '사무용품', desc: '명함·도장·현수막' },
  { key: 'education', icon: '🎓', label: '교육콘텐츠', desc: 'VOD·실무 템플릿' },
  { key: 'auction', icon: '⚖️', label: '경매 컨설팅', desc: '권리분석·입찰가' },
  { key: 'coaching', icon: '🤖', label: 'AI 과정·코칭', desc: '자동화·1:1 코칭' },
]
const CATEGORY_LABEL = {
  office_supply: '사무용품',
  education: '교육콘텐츠',
  auction: '경매 컨설팅',
  coaching: 'AI 과정·코칭',
}

function MainPage() {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)

  // 공개 API로 상품 목록 불러오기
  useEffect(() => {
    fetch(API_BASE + '/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => {})
  }, [])

  // 카테고리 필터 → 페이지네이션
  const filtered = category === 'all' ? products : products.filter((p) => p.category === category)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const pageProducts = filtered.slice(start, start + PAGE_SIZE)

  const selectCategory = (key) => {
    setCategory(key)
    setPage(1) // 카테고리 바뀌면 1페이지로
  }

  return (
    <div className="home">
      <Navbar />

      {/* 히어로 */}
      <section className="home-hero">
        <span className="home-badge">AI 시대, 공인중개사의 든든한 파트너</span>
        <h1 className="home-title">
          사무소에 필요한 실물부터,<br />
          AI 자동화 도구까지 — 한 곳에서.
        </h1>
        <p className="home-sub">
          초보·개업·소공·매출 돌파구를 찾는 공인중개사를 위한 올인원 큐레이션 마켓.
        </p>
        <ul className="home-trust">
          <li>✓ 엄선된 큐레이션</li>
          <li>✓ 실물부터 AI 도구까지</li>
          <li>✓ 한 곳에서 간편하게</li>
        </ul>
      </section>

      {/* 카테고리 바로가기 */}
      <section className="category-section">
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`category-card ${category === c.key ? 'active' : ''}`}
              onClick={() => selectCategory(c.key)}
            >
              <span className="category-icon">{c.icon}</span>
              <span className="category-text">
                <span className="category-label">{c.label}</span>
                <span className="category-desc">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 상품 진열 */}
      <section className="product-section" id="products">
        <div className="product-section-head">
          <h2 className="product-section-title">
            {category === 'all' ? '전체 상품' : CATEGORY_LABEL[category]}
            <span className="product-count-badge">{filtered.length}</span>
          </h2>
          {category !== 'all' && (
            <button type="button" className="category-reset" onClick={() => selectCategory('all')}>
              전체 보기
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="product-empty">해당 카테고리에 상품이 없습니다.</p>
        ) : (
          <>
            <div className="product-grid">
              {pageProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`page-btn ${page === n ? 'active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}

export default MainPage
