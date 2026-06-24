// 상품 1개를 카드로 보여주는 재사용 컴포넌트.
// 메인 진열·상품 목록 등 여러 곳에서 <ProductCard product={...} /> 로 재사용한다.
// 카드를 클릭하면 상품 상세 페이지(/products/:id)로 이동한다.
import { Link } from 'react-router-dom'

// 카테고리 코드 → 한글 라벨 (상품 모델 enum 과 1:1)
const CATEGORY_LABEL = {
  office_supply: '사무용품',
  education: '교육콘텐츠',
  auction: '경매 컨설팅',
  coaching: 'AI 과정·코칭',
}

function ProductCard({ product }) {
  const price = Number(product.price).toLocaleString('ko-KR') // 천 단위 콤마
  const isDigital = product.type === 'digital'
  const categoryLabel = CATEGORY_LABEL[product.category] || product.category

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-card-img">
        {product.image ? (
          <img src={product.image} alt={product.title} />
        ) : (
          <div className="product-card-noimg">이미지 준비 중</div>
        )}
        {/* 우리 시그니처 — 실물/디지털 뱃지 */}
        <span className={`type-badge ${isDigital ? 'digital' : 'physical'}`}>
          {isDigital ? '디지털' : '실물'}
        </span>
      </div>

      <div className="product-card-body">
        <span className="product-card-cat">{categoryLabel}</span>
        <h3 className="product-card-title">{product.title}</h3>
        <p className="product-card-price">{price}<span className="won">원</span></p>
      </div>
    </Link>
  )
}

export default ProductCard
