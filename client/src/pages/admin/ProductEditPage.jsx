import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { API_BASE } from '../../config'

function ProductEditPage() {
  const navigate = useNavigate()
  const { id } = useParams() // 주소의 :id (수정할 상품 번호)
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    sku: '',
    title: '',
    price: '',
    type: 'physical',
    category: 'office_supply',
    image: '',
    description: '',
  })

  // 관리자 가드 + 기존 상품 불러와서 폼 채우기
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch(API_BASE + '/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        if (user.user_type !== 'admin') {
          navigate('/')
          return
        }
        setAllowed(true)
        // 기존 상품 데이터를 불러와 폼에 미리 채운다
        return fetch(`${API_BASE}/api/products/${id}`)
          .then((res) => {
            if (!res.ok) throw new Error('상품을 찾을 수 없음')
            return res.json()
          })
          .then((product) => {
            setForm({
              sku: product.sku || '',
              title: product.title || '',
              price: product.price ?? '',
              type: product.type || 'physical',
              category: product.category || 'office_supply',
              image: product.image || '',
              description: product.description || '',
            })
            setLoading(false)
          })
      })
      .catch(() => navigate('/admin/products'))
  }, [navigate, id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Cloudinary 업로드 위젯 (등록 페이지와 동일) — 여기서 기존 상품에 이미지 추가/변경 가능
  const openUploadWidget = () => {
    if (!window.cloudinary) {
      alert('이미지 업로더를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        language: 'ko',
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setForm((prev) => ({ ...prev, image: result.info.secure_url }))
        }
      }
    )
    widget.open()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT', // 수정 = PUT
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('상품이 수정되었습니다! ✏️')
        navigate('/admin/products')
      } else {
        alert('수정 실패: ' + (data.message || '다시 시도해 주세요.'))
      }
    } catch (err) {
      alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (!allowed || loading) return null

  return (
    <div className="home">
      <Navbar />

      <main className="product-create">
        <h1 className="product-create-title">상품 수정</h1>
        <p className="product-create-sub">상품 정보를 수정합니다. (이미지도 여기서 추가/변경)</p>

        <div className="product-create-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">
              SKU (상품 식별코드)
              <input type="text" name="sku" value={form.sku} onChange={handleChange} required />
            </label>

            <label className="auth-label">
              상품명
              <input type="text" name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label className="auth-label">
              가격 (원)
              <input type="number" name="price" value={form.price} onChange={handleChange} min="0" required />
            </label>

            <label className="auth-label">
              유형
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="physical">실물 (배송)</option>
                <option value="digital">디지털 (다운로드)</option>
              </select>
            </label>

            <label className="auth-label">
              카테고리
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="office_supply">사무용품</option>
                <option value="education">교육콘텐츠</option>
                <option value="auction">경매 컨설팅</option>
                <option value="coaching">AI 과정·코칭</option>
              </select>
            </label>

            <label className="auth-label">
              대표 이미지 <span className="label-optional">(선택)</span>
              <button type="button" className="upload-btn" onClick={openUploadWidget}>
                {form.image ? '이미지 변경' : 'Cloudinary로 이미지 업로드'}
              </button>
            </label>

            {form.image && (
              <div className="image-preview">
                <img src={form.image} alt="상품 이미지 미리보기" />
              </div>
            )}

            <label className="auth-label">
              상품 설명 <span className="label-optional">(선택)</span>
              <textarea name="description" value={form.description} onChange={handleChange} rows="4" />
            </label>

            <button type="submit" className="auth-button">수정 완료</button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ProductEditPage
