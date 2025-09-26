'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
            const res = await fetch('/api/v1/public/auth/password-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: shop.tenantId, login: loginId, password })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Falha no login')
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
            const res = await fetch('/api/v1/public/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: shop.tenantId, email: registerEmail || undefined, phone: registerPhone || undefined, password: registerPassword })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Falha ao criar conta')
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
        <div className="min-h-screen w-full bg-white text-zinc-900 flex flex-col">
            {shop?.bannerUrl ? (
                <div className="w-full h-80 md:h-96 bg-white flex items-center justify-center">
                    <img src={shop.bannerUrl} alt={shop.name} className="max-h-full w-auto object-contain" />
                </div>
            ) : (
                <div className="w-full h-80 md:h-96 bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-xl text-zinc-700">Bem-vindo</span>
                </div>
            )}

            <div className="flex-1 flex items-center justify-center p-4 -mt-14 md:-mt-20">
                <div className="w-full max-w-md bg-white rounded-lg border border-zinc-200 p-6 shadow-xl">
                    <div className="flex flex-col items-center mb-6">
                        {shop?.logoUrl ? (
                            <img src={shop.logoUrl} alt={shop.name} className="h-14 object-contain" />
                        ) : (
                            <div className="h-14 flex items-center font-semibold tracking-wide">{shop?.name || 'Sua barbearia'}</div>
                        )}
                        <div className="text-sm text-zinc-600 mt-1">Acesse sua conta para agendar</div>
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
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-lg border border-zinc-200 p-5 shadow-xl">
                        <div className="text-base font-medium mb-3">Entrar na conta</div>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="text-sm text-zinc-700">Login (email ou telefone)</label>
                                <input value={loginId} onChange={(e) => setLoginId(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="email@dominio.com ou 11999999999" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-700">Senha</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="••••••••" />
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
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
                                <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="mt-1 w-full bg-white border border-zinc-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400" placeholder="••••••••" />
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
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
            <div className="w-full py-8 px-4 border-t border-zinc-200 bg-slate-50">
                <h2 className="text-center text-zinc-800 text-base md:text-lg">
                    Seja bem-vindo à barbearia {shop?.name}
                </h2>
            </div>
        </div>
    )
}


