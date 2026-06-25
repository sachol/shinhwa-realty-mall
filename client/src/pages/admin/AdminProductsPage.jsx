import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { API_BASE } from '../../config'

// 유형 필터 (우리 시그니처 — 실물/디지털)
const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'physical', label: '실물' },
  { key: 'digital', label: '디지털' },
]
// 정렬 옵션
const SORTS = [
  { key: 'latest', label: '최신 등록순' },
  { key: 'price_high', label: '가격 높은순' },
  { key: 'price_low', label: '가격 낮은순' },
  { key: 'name', label: '이름순' },
]
const CATEGORY_LABEL = {
  office_supply: '사무용품',
  education: '교육콘텐츠',
  auction: '경매 컨설팅',
  coaching: 'AI 과정·코칭',
}
const PAGE_SIZE = 10 // 한 페이지에 보여줄 상품 개수

function AdminProductsPage() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null) // 삭제 확인 모달에 띄울 대상 상품
  const [deleting, setDeleting] = useState(false)         // 삭제 요청 진행 중 표시

  // 관리자 가드 + 상품 불러오기
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch(API_BASE + '/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        if (user.user_type !== 'admin') {
          navigate('/')
          return
        }
        setAllowed(true)
        loadProducts()
      })
      .catch(() => navigate('/login'))
  }, [navigate])

  const loadProducts = () => {
    fetch(API_BASE + '/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => {})
  }

  // 검색/필터/정렬이 바뀌면 1페이지로 돌아가기
  useEffect(() => {
    setPage(1)
  }, [query, filter, sort])

  // 유형별 개수 (필터 탭에 표시)
  const counts = {
    all: products.length,
    physical: products.filter((p) => p.type === 'physical').length,
    digital: products.filter((p) => p.type === 'digital').length,
  }

  // 검색(상품명·SKU) + 유형 필터 + 정렬
  const filtered = products
    .filter((p) => {
      const q = query.toLowerCase()
      const matchesQuery =
        p.title.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
      const matchesFilter = filter === 'all' || p.type === filter
      return matchesQuery && matchesFilter
    })
    .sort((a, b) => {
      if (sort === 'price_high') return b.price - a.price
      if (sort === 'price_low') return a.price - b.price
      if (sort === 'name') return a.title.localeCompare(b.title)
      return new Date(b.createdAt) - new Date(a.createdAt) // 최신 등록순
    })

  // 페이지네이션 — 검색·필터·정렬이 끝난 결과를 PAGE_SIZE 개씩 자른다
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const paged = filtered.slice(start, start + PAGE_SIZE)

  // 삭제 실행 (DELETE /api/products/:id — admin만). 확인 모달에서 '삭제'를 눌렀을 때만 호출
  const confirmDelete = async () => {
    if (!deleteTarget) return
    const token = localStorage.getItem('token')
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/products/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id))
        setDeleteTarget(null) // 모달 닫기
      } else {
        const data = await res.json()
        alert('삭제 실패: ' + (data.message || ''))
      }
    } catch (err) {
      alert('서버에 연결할 수 없습니다.')
    } finally {
      setDeleting(false)
    }
  }

  if (!allowed) return null

  return (
    <div className="home">
      <Navbar />

      <main className="admin">
        <div className="admin-products-head">
          <div>
            <h1 className="admin-title">상품 관리</h1>
            <p className="admin-sub">등록된 상품을 조회하고 관리합니다.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/admin/products/create')}>
            + 새 상품 등록
          </button>
        </div>

        {/* 필터 + 정렬 + 검색 */}
        <div className="admin-products-toolbar">
          <div className="filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="filter-count">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <input
              className="product-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명·SKU 검색"
            />
          </div>
        </div>

        {/* 상품 표 */}
        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>상품명</th>
                <th>유형</th>
                <th>카테고리</th>
                <th className="right">가격</th>
                <th className="right">관리</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="table-thumb">
                      {p.image ? <img src={p.image} alt={p.title} /> : <span>없음</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-product">
                      <span className="table-product-name">{p.title}</span>
                      <span className="table-product-sku">SKU: {p.sku}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge-sm ${p.type === 'digital' ? 'digital' : 'physical'}`}>
                      {p.type === 'digital' ? '디지털' : '실물'}
                    </span>
                  </td>
                  <td>
                    <span className="category-pill">{CATEGORY_LABEL[p.category] || p.category}</span>
                  </td>
                  <td className="right table-price">{Number(p.price).toLocaleString('ko-KR')}원</td>
                  <td className="right">
                    <button className="table-action" onClick={() => navigate(`/admin/products/${p._id}/edit`)}>
                      수정
                    </button>
                    <button className="table-action danger" onClick={() => setDeleteTarget(p)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="product-empty">상품이 없습니다.</p>}
        </div>

        {/* 페이지 버튼 — 페이지가 2개 이상일 때만 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
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
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        )}

        <p className="product-count">총 {filtered.length}개 상품</p>

        {/* 삭제 확인 모달 — 바로 삭제하지 않고 한 번 더 확인받는다 */}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon">🗑️</div>
              <h3 className="modal-title">상품을 삭제할까요?</h3>
              <p className="modal-text">
                <strong>{deleteTarget.title}</strong> 상품이 삭제됩니다.<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  취소
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? '삭제 중…' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminProductsPage
