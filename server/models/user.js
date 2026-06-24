// ============================================
//  회원(User) 스키마 — 회원 데이터의 '설계도'
// ============================================
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, unique: true }, // 이메일: 필수, 중복 불가
    name:      { type: String, required: true },               // 이름: 필수
    password:  { type: String, required: true },               // 비밀번호: 필수 (나중에 암호화해서 저장)
    user_type: { type: String, enum: ['customer', 'admin'], default: 'customer' }, // 회원 종류: 기본 customer
    address:   { type: String },                               // 주소: 선택 (배송 때 입력 가능)
  },
  { timestamps: true } // 가입일(createdAt)·수정일(updatedAt) 자동 기록
)

// 이 설계도로 'User' 모델을 만들어 내보내기 (다른 파일에서 가져다 씀)
module.exports = mongoose.model('User', userSchema)
