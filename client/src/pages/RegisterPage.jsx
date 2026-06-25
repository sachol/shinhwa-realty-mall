import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

function RegisterPage() {
  const navigate = useNavigate() // 가입 성공 후 페이지 이동에 사용

  // 입력값 (컨트롤러가 받는 값: email·name·password)
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  // 비밀번호 확인 (백엔드로는 안 보냄 — 일치 검사용)
  const [passwordConfirm, setPasswordConfirm] = useState('')
  // 약관 동의 상태
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 약관 개별 체크
  const handleAgree = (e) => {
    setAgree({ ...agree, [e.target.name]: e.target.checked })
  }

  // 전체 동의: 3개를 한 번에 켜고/끄기
  const handleAgreeAll = (e) => {
    const checked = e.target.checked
    setAgree({ terms: checked, privacy: checked, marketing: checked })
  }

  // 3개가 모두 체크되면 '전체 동의'도 체크된 것으로 표시
  const allChecked = agree.terms && agree.privacy && agree.marketing

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 1) 비밀번호 일치 확인
    if (form.password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    // 2) 필수 약관 동의 확인
    if (!agree.terms || !agree.privacy) {
      alert('필수 약관(이용약관, 개인정보처리방침)에 동의해 주세요.')
      return
    }

    // 3) 백엔드(포트 5000)로 회원가입 요청
    try {
      const res = await fetch(API_BASE + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), // { email, name, password }
      })

      if (res.ok) {
        alert('회원가입이 완료되었습니다! 🎉')
        navigate('/') // 메인으로 이동
      } else {
        const data = await res.json()
        alert('회원가입 실패: ' + (data.message || '다시 시도해 주세요.'))
      }
    } catch (err) {
      // 서버가 꺼져있거나 인터넷이 끊긴 경우
      alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand" aria-label="신화 부동산 쇼핑몰 - 공인중개사 올인원 큐레이션 마켓 홈">
          <span className="brand-emblem" aria-hidden="true">🏠</span>
          <span className="brand-stack">
            <span className="brand-name">신화 부동산<span className="brand-accent">쇼핑몰</span></span>
            <span className="brand-tagline">공인중개사를 위한 올인원 큐레이션 마켓</span>
          </span>
        </Link>
        <h1 className="auth-title">회원가입</h1>
        <p className="auth-subtitle">공인중개사 올인원 마켓에 오신 것을 환영합니다.</p>

        {/* autoComplete="off" — 회원가입은 새 계정 생성이므로 브라우저 자동완성(저장된 로그인값) 방지 */}
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          <label className="auth-label">
            이메일
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              autoComplete="off"
              required
            />
          </label>

          <label className="auth-label">
            이름
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="홍길동"
              required
            />
          </label>

          <label className="auth-label">
            비밀번호
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="auth-label">
            비밀번호 확인
            <input
              type="password"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              autoComplete="new-password"
              required
            />
          </label>

          {/* ===== 약관 동의 ===== */}
          <div className="auth-agree">
            <label className="auth-agree-all">
              <input type="checkbox" checked={allChecked} onChange={handleAgreeAll} />
              <span>전체 동의</span>
            </label>

            <div className="auth-agree-list">
              <div className="auth-agree-item">
                <label>
                  <input type="checkbox" name="terms" checked={agree.terms} onChange={handleAgree} />
                  <span>이용약관 동의 <em>(필수)</em></span>
                </label>
                <button type="button" className="auth-view">보기</button>
              </div>

              <div className="auth-agree-item">
                <label>
                  <input type="checkbox" name="privacy" checked={agree.privacy} onChange={handleAgree} />
                  <span>개인정보처리방침 동의 <em>(필수)</em></span>
                </label>
                <button type="button" className="auth-view">보기</button>
              </div>

              <div className="auth-agree-item">
                <label>
                  <input type="checkbox" name="marketing" checked={agree.marketing} onChange={handleAgree} />
                  <span>마케팅 정보 수신 동의 <em className="optional">(선택)</em></span>
                </label>
                <button type="button" className="auth-view">보기</button>
              </div>
            </div>
          </div>

          <button type="submit" className="auth-button">회원가입</button>
        </form>

        <p className="auth-footer">
          <Link to="/">← 메인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
