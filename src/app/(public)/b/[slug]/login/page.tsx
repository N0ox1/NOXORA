'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'

type Shop = { id: string; name: string; slug: string; tenantId: string; logoUrl?: string | null; bannerUrl?: string | null }

export default function PublicLoginPage() {
    const params = useParams()
    const slug = String(params.slug)
    const router = useRouter()
    const [shop, setShop] = useState<Shop | null>(null)
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [loginId, setLoginId] = useState('') // email ou telefone
    const [password, setPassword] = useState('')
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [registerEmail, setRegisterEmail] = useState('')
    const [registerPhone, setRegisterPhone] = useState('')
    const [registerPassword, setRegisterPassword] = useState('')
    const [showForgot, setShowForgot] = useState(false)
    const [forgotLogin, setForgotLogin] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false)

    const GENERIC_BANNER_URL = 'https://otzkbzkko9zzxvfo.public.blob.vercel-storage.com/Gemini_Generated_Image_cgj8lvcgj8lvcgj8.png'

    useEffect(() => {
        let alive = true
            ; (async () => {
                try {
                    const res = await fetch(`/api/barbershop/public/${slug}`, { cache: 'no-store' })
                    if (!alive) return
                    if (res.ok) {
                        const data = await res.json()
                        setShop({ id: data.id, name: data.name, slug: data.slug, tenantId: data.tenantId, logoUrl: data.logoUrl, bannerUrl: data.bannerUrl })
                    }
                } catch { }
            })()
        return () => { alive = false }
    }, [slug])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!shop) return
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/v1/public/auth/login?slug=${slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginId, password })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Falha no login')
            router.push(`/b/${slug}`)
        } catch (err: any) {
            setError(err?.message || 'Erro inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    const createAccount = async () => {
        if (!shop) return
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/v1/public/auth/register?slug=${slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: registerEmail,
                    password: registerPassword,
                    name: registerEmail.split('@')[0], // Usar parte do email como nome temporário
                    acceptTerms: true
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Falha ao criar conta')
            router.push(`/b/${slug}`)
        } catch (err: any) {
            setError(err?.message || 'Erro inesperado')
        } finally {
            setIsLoading(false)
            setShowRegisterModal(false)
        }
    }

    const forgotPassword = async () => {
        if (!shop) return
        setIsLoading(true)
        setError(null)
        try {
            await fetch('/api/v1/public/auth/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: shop.tenantId, login: forgotLogin })
            })
            setShowForgot(false)
        } catch (err: any) {
            setError(err?.message || 'Erro inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 relative">
            <div className="relative hidden md:block">
                <img src={shop?.bannerUrl || GENERIC_BANNER_URL} alt={shop?.name || 'Barbershop'} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                {/* Logo removida conforme solicitado */}
            </div>

            <div className="relative z-10 flex items-center justify-center bg-white p-6">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center mb-6">
                        {shop?.logoUrl ? (
                            <img src={shop.logoUrl} alt={shop.name} className="h-14 object-contain" />
                        ) : (
                            <Logo width={140} height={45} />
                        )}
                    </div>

                    <div className="gradient-border rounded-xl p-[2px] shadow-xl">
                        <div className="bg-white rounded-xl p-6">
                            <div className="text-center mb-4">
                                <div className="text-xs tracking-wider text-zinc-500">BEM-VINDO DE VOLTA.</div>
                                <div className="text-[11px] text-zinc-500">Faça login para gerenciar seus agendamentos.</div>
                            </div>
                            <div className="space-y-4">
                                {error && <div className="text-red-500 text-sm">{error}</div>}
                                <div className="space-y-3">
                                    <button onClick={() => setShowLoginModal(true)} disabled={isLoading} className="w-full bg-zinc-900 text-white rounded py-2 font-medium disabled:opacity-60 hover:bg-black">
                                        Entrar
                                    </button>
                                    <button type="button" onClick={() => setShowRegisterModal(true)} className="w-full bg-transparent border border-zinc-300 text-zinc-700 rounded py-2 font-medium">
                                        Criar conta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showLoginModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-lg border border-zinc-200 p-5 shadow-xl">
                        <div className="text-base font-medium mb-3">Entrar na conta</div>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="text-sm text-zinc-700">Login (email ou telefone)</label>
                                <input value={loginId} onChange={(e) => setLoginId(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="email@dominio.com ou 11999999999" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-700">Senha</label>
                                <div className="relative">
                                    <input type={passwordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="••••••••" />
                                    <button type="button" aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setPasswordVisible(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-zinc-500 hover:text-zinc-700">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <button disabled={isLoading} className="bg-zinc-900 text-white rounded px-4 py-2 font-medium disabled:opacity-60 hover:bg-black">
                                    {isLoading ? 'Entrando...' : 'Entrar'}
                                </button>
                                <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-zinc-600 hover:underline">
                                    Esqueci minha senha
                                </button>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-transparent border border-zinc-300 text-zinc-700 rounded py-2 font-medium">Voltar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-lg border border-zinc-200 p-5 shadow-xl">
                        <div className="text-base font-medium mb-3">Criar conta</div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-zinc-700">Email</label>
                                <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-700">Telefone</label>
                                <input value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="11999999999" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-700">Senha</label>
                                <div className="relative">
                                    <input type={registerPasswordVisible ? 'text' : 'password'} value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="••••••••" />
                                    <button type="button" aria-label={registerPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setRegisterPasswordVisible(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-zinc-500 hover:text-zinc-700">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <button onClick={createAccount} className="flex-1 bg-zinc-900 text-white rounded py-2 font-medium hover:bg-black">Criar</button>
                                <button onClick={() => setShowRegisterModal(false)} className="flex-1 bg-transparent border border-zinc-300 text-zinc-700 rounded py-2 font-medium">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showForgot && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-lg border border-zinc-200 p-5 shadow-xl">
                        <div className="text-base font-medium mb-3">Recuperar senha</div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-zinc-700">Email ou telefone</label>
                                <input value={forgotLogin} onChange={(e) => setForgotLogin(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="email@dominio.com ou 11999999999" />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <button onClick={forgotPassword} className="flex-1 bg-zinc-900 text-white rounded py-2 font-medium hover:bg-black">Enviar</button>
                                <button onClick={() => setShowForgot(false)} className="flex-1 bg-transparent border border-zinc-300 text-zinc-700 rounded py-2 font-medium">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
              .gradient-border {
                overflow: hidden;
                background: linear-gradient(120deg, #01ABFE, #0EA5E9, #2563EB, #60A5FA, #01ABFE);
                background-size: 400% 400%;
                animation: gradient-move 8s ease infinite;
              }
              @keyframes gradient-move {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
        </div>
    )
}
