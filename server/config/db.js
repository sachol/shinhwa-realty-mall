// ============================================
//  MongoDB 연결 설정 (Mongoose)
// ============================================
const mongoose = require('mongoose')
const dns = require('dns')

// [로컬 DNS 우회] 일부 네트워크의 DNS가 MongoDB의 SRV 조회(mongodb+srv://)를 거부하는 문제 해결.
// Node가 공용 DNS(구글 8.8.8.8 / 클라우드플레어 1.1.1.1)로 주소를 조회하도록 지정.
dns.setServers(['8.8.8.8', '1.1.1.1'])

async function connectDB() {
  const uri = process.env.MONGO_URI

  // 아직 Atlas 주소가 없으면 → 경고만 하고 서버는 계속 실행 (개발 초기 편의)
  if (!uri) {
    console.warn('⚠️  MONGO_URI가 .env에 없습니다. MongoDB 없이 서버만 실행됩니다.')
    console.warn('    → 회원가입 단계에서 MongoDB Atlas 주소를 server/.env 의 MONGO_URI 에 넣어주세요.')
    return
  }

  try {
    await mongoose.connect(uri)
    console.log('✅ MongoDB 연결 성공')
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message)
  }
}

module.exports = connectDB
