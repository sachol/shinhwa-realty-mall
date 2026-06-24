// ============================================
//  주문(Order) 스키마 — 결제까지 마친 '주문서' 한 장
//  주문 1개 : 주문 항목 N개 (1:N). 장바구니를 '그때 기록'으로 박제한 것.
//  ※ 우리 정체성: 실물은 배송, 디지털은 이메일, 서비스는 카톡/일정 → 유형(type)을 항목마다 보관
// ============================================
const mongoose = require('mongoose')

// 주문 항목 (주문 시점 스냅샷) — 나중에 상품이 바뀌거나 삭제돼도 주문 내역은 그대로 보존
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },             // 상품명 (스냅샷)
    price: { type: Number, required: true, min: 0 },     // 가격 (스냅샷)
    quantity: { type: Number, required: true, min: 1 },  // 수량
    type: { type: String, enum: ['physical', 'digital'], required: true }, // 유형 (스냅샷)
  },
  { _id: true }
)

const orderSchema = new mongoose.Schema(
  {
    // 주문번호 — 사람이 읽는 식별자 (예: ORD-20260622-001). 주문 생성 시 컨트롤러에서 만든다
    orderNumber: { type: String, required: true, unique: true },
    // 누가 주문했나
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 주문 항목들 (N개) — 1:N
    items: [orderItemSchema],

    // 주문자 정보
    orderer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true }, // 디지털 전달·영수증에 필수
      phone: { type: String, trim: true },                 // 배송/일정 연락
    },

    // 배송 정보 — 실물 상품이 포함된 주문일 때만 채운다 (디지털·서비스만이면 비움)
    // 한국식 주소 체계: 받는 분 / 연락처 / 주소 / 상세주소 / 우편번호
    shipping: {
      recipient: { type: String, trim: true },     // 받는 분 (주문자와 다를 수 있음)
      phone: { type: String, trim: true },         // 받는 분 연락처
      address: { type: String, trim: true },       // 기본 주소
      detailAddress: { type: String, trim: true }, // 상세 주소
      zipcode: { type: String, trim: true },       // 우편번호
    },

    // 요청사항 — 명함 이름·상호 등 맞춤 제작 요청 (선택)
    memo: { type: String, trim: true },

    // 금액
    totalAmount: { type: Number, required: true, min: 0 }, // 상품 합계
    shippingFee: { type: Number, default: 0, min: 0 },     // 배송비 (실물 3,000 / 디지털 0)
    finalAmount: { type: Number, required: true, min: 0 }, // 최종 결제 금액 (상품+배송비)

    // 결제 정보 (KG이니시스)
    payment: {
      method: { type: String, default: 'kg' },
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
      paidAt: { type: Date },
      impUid: { type: String }, // 포트원 결제 고유번호 (결제 확인용)
    },

    // 주문 상태 — 실물(접수→제작→배송→완료) / 디지털·서비스(접수→완료)
    status: {
      type: String,
      enum: ['placed', 'making', 'shipping', 'completed', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true } // createdAt(주문일시) / updatedAt
)

module.exports = mongoose.model('Order', orderSchema)
