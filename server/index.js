// ============================================
//  중개사 올인원 마켓 - 백엔드 진입점 (Express + MongoDB)
// ============================================
const express = require('express')        // 웹 서버 만드는 도구
const cors = require('cors')              // 프론트(다른 주소)에서 오는 요청을 허용
require('dotenv').config()                // .env 파일의 비밀값(PORT, MONGO_URI 등)을 불러옴
const connectDB = require('./config/db')  // MongoDB(Mongoose) 연결 함수

const app = express()
const PORT = process.env.PORT || 5000

// ── MongoDB 연결 ──
connectDB()

// ── 미들웨어(요청이 들어올 때 거치는 공통 처리) ──
app.use(cors())             // CORS 허용: client(5173)에서 server(5000)로 요청 가능
app.use(express.json())     // 요청 본문이 JSON이면 자동으로 해석해줌

// ── 헬스 체크 라우트: 서버가 살아있는지 확인용 ──
app.get('/', (req, res) => {
  res.json({ message: '중개사 올인원 API 서버가 정상 동작 중입니다 🏠' })
})

// ── 라우트(API 입구) 연결 ──
app.use('/api/users', require('./routes/user'))   // 회원(User) 관련 CRUD
app.use('/api/products', require('./routes/product')) // 상품(Product) 관련 CRUD
app.use('/api/cart', require('./routes/cart'))    // 장바구니(Cart) 관련 CRUD
app.use('/api/orders', require('./routes/order')) // 주문(Order) 관련

// ── 서버 시작 ──
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`)
})
