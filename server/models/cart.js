// ============================================
//  장바구니(Cart) 스키마 — "회원 1명당 장바구니 1개" 안에 상품 여러 개(N)
//  결제로 가기 전, 사고 싶은 상품을 모아두는 '그릇'이다. (1:N 관계)
//  ─ Cart(그릇) 1개  :  items(담긴 상품) N개
// ============================================
const mongoose = require('mongoose')

// 장바구니에 담긴 상품 1줄 (= CartItem). Cart 안에 배열로 N개가 들어간다.
const cartItemSchema = new mongoose.Schema(
  {
    // 어떤 상품인지 — Product 컬렉션을 가리킨다(ref). 나중에 populate로 상세정보를 불러옴
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // 수량 (최소 1개, 기본 1개)
    quantity: { type: Number, default: 1, min: 1 },
    // 담을 당시의 가격을 박제(스냅샷) — 나중에 상품 가격이 바뀌어도 장바구니엔 이 가격 유지
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true } // 항목마다 고유 id(_id = itemId) 부여 → 개별 삭제/수량변경에 사용
)

const cartSchema = new mongoose.Schema(
  {
    // 누구의 장바구니인가 — User 컬렉션을 가리킨다. 회원당 1개만(unique)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // 담긴 상품들 (N개) — 1:N 의 'N' 부분
    items: [cartItemSchema],

    // 합계 캐시 — items가 바뀔 때마다 라우터에서 다시 계산해 저장(헤더 뱃지·합계 표시에 사용)
    totalAmount: { type: Number, default: 0, min: 0 }, // 총 금액 (가격 × 수량 의 합)
    totalItems: { type: Number, default: 0, min: 0 },  // 총 수량 (quantity 의 합)
  },
  { timestamps: true } // createdAt / updatedAt 자동 기록
)

module.exports = mongoose.model('Cart', cartSchema)
