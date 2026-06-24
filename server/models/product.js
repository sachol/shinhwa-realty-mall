// ============================================
//  상품(Product) 스키마 — 상품 데이터의 '설계도'
//  회원(User) 스키마와 같은 방식 + 우리만의 type/category 필드
// ============================================
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    sku:         { type: String, required: true, unique: true, trim: true }, // 상품 식별코드 (필수 + 유니크: 중복 불가)
    title:       { type: String, required: true, trim: true },  // 상품명 (필수 + 공백 정리)
    price:       { type: Number, required: true, min: 0 },      // 가격 (필수 + 음수 불가)
    description: { type: String, trim: true },                   // 설명 (선택)
    image:       { type: String },                              // 대표 이미지 URL (Cloudinary)
    stock:       { type: Number, default: 0, min: 0 },          // 재고 (기본 0)

    // ⭐ 우리만의 시그니처 — 실물/디지털 구분
    type: { type: String, enum: ['physical', 'digital'], default: 'physical' },
    // 카테고리 — 사무용품 / 교육콘텐츠 / 경매 컨설팅 / AI 과정·코칭
    category: {
      type: String,
      enum: ['office_supply', 'education', 'auction', 'coaching'],
      default: 'office_supply',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)
