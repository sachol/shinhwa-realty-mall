// ============================================
//  인증 미들웨어 — 요청의 '토큰(영화표)'을 검사하는 검문소
//  유효하면 통과(next), 없거나 위조/만료면 거부(401).
// ============================================
const jwt = require('jsonwebtoken')

function auth(req, res, next) {
  try {
    // 1) Authorization 헤더에서 토큰 꺼내기 — 형식: "Bearer <토큰>"
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '로그인이 필요합니다.' })
    }
    const token = authHeader.split(' ')[1] // "Bearer" 뒤의 토큰만 추출

    // 2) 토큰 검증 — 위조됐거나 만료됐으면 여기서 에러가 남
    //    .env 의 JWT_SECRET 으로 서명을 확인한다 (발급 때와 같은 키여야 통과)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 3) 통과! → 요청(req)에 사용자 정보를 심어서 다음(컨트롤러)으로 넘김
    req.user = decoded // { userId, user_type, iat(발급시각), exp(만료시각) }
    next()
  } catch (err) {
    return res.status(401).json({ message: '유효하지 않거나 만료된 토큰입니다.' })
  }
}

module.exports = auth
