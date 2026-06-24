// 사이트 공통 푸터 — 쇼핑몰 신뢰 요소(상호·사업자정보·고객센터·법적 문구).
// 연락처·사업자번호는 실습용 더미 데이터이며, 교육·실습용 데모 면책 문구를 포함한다.
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* 브랜드 */}
        <div className="footer-brand">
          <span className="footer-logo">🏠 신화 부동산 쇼핑몰</span>
          <span className="footer-en">SHINHWA REALTY MALL</span>
          <p className="footer-slogan">공인중개사를 위한 올인원 큐레이션 마켓</p>
        </div>

        {/* 고객센터 */}
        <div className="footer-col">
          <h4 className="footer-col-title">고객센터</h4>
          <p className="footer-tel">1600-0000</p>
          <p>평일 10:00 ~ 18:00 (점심 12:00 ~ 13:00)</p>
          <p>주말·공휴일 휴무</p>
          <p>support@shinhwarealty.kr</p>
        </div>

        {/* 회사 정보 (전자상거래법 표시사항) */}
        <div className="footer-col">
          <h4 className="footer-col-title">회사 정보</h4>
          <p>상호: 신화 부동산 쇼핑몰 (Shinhwa Realty Mall)</p>
          <p>대표: 홍신화 &nbsp;|&nbsp; 개인정보책임자: 홍신화</p>
          <p>사업자등록번호: 123-45-67890</p>
          <p>통신판매업신고: 제2026-서울강남-00000호</p>
          <p>주소: 서울특별시 강남구 테헤란로 123, 4층</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-links">
          <a href="#">이용약관</a>
          <span>·</span>
          <a href="#">개인정보처리방침</a>
          <span>·</span>
          <a href="#">고객센터</a>
        </div>
        <p className="footer-notice">
          ⚠ 본 사이트는 교육·실습용으로 제작된 데모이며, 실제 상거래가 이루어지지 않습니다.
        </p>
        <p className="footer-copy">© 2026 Shinhwa Realty Mall. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
