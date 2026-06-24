// ============================================
//  관리자 전용 미들웨어 — auth 미들웨어 '다음'에 사용하는 2차 검문소.
//  로그인한 사용자가 'admin' 권한인지 확인한다.
//  ※ 통념의 role 이 아니라 우리 필드 user_type 으로 검사! (배운 교훈 적용)
// ============================================
function adminOnly(req, res, next) {
  // auth 미들웨어가 먼저 req.user 를 채워줘야 동작한다.
  if (!req.user || req.user.user_type !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' })
  }
  next() // 관리자 확인됨 → 통과
}

module.exports = adminOnly
