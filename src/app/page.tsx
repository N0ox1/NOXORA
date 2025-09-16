import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1"></div>
            <div className="flex-1 flex justify-center">
              <Logo width={140} height={45} />
            </div>
            <div className="flex-1 flex justify-end">
              <nav className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-[#01ABFE] hover:text-white font-medium transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg border border-[#01ABFE] bg-white hover:bg-[#01ABFE]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 font-medium"
                  style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
                >
                  Cadastrar
                </Link>
              </nav>
            </div>
          </div>
        </div>
        {/* Linha separadora com degradê azul */}
        <div
          className="h-0.5"
          style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
        ></div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
                Sistema de Gestão para
                <span className="text-[#01ABFE]"> Barbearias</span>
              </h2>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Gerencie agendamentos, clientes, funcionários e faturamento de forma simples e eficiente.
                Ideal para barbearias de todos os tamanhos.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
                  >
                    Começar Agora
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <Link
                    href="/b/demo"
                    className="w-full flex items-center justify-center px-8 py-3 border border-[#01ABFE] text-base font-medium rounded-md text-[#01ABFE] bg-white hover:bg-[#01ABFE] hover:text-white md:py-4 md:text-lg md:px-10 transition-colors"
                  >
                    Ver Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-[#01ABFE] font-semibold text-sm uppercase tracking-wide mb-4">
                Funcionalidades
              </p>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Tudo que você precisa para sua barbearia
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Agendamentos Inteligentes */}
              <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Agendamentos Inteligentes
                </h3>
                <p className="text-gray-600">
                  Confirmações automáticas e lembretes para reduzir faltas.
                </p>
              </div>

              {/* Gestão de Clientes */}
              <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Gestão de Clientes
                </h3>
                <p className="text-gray-600">
                  Histórico completo de serviços e preferências dos clientes.
                </p>
              </div>

              {/* Equipe Organizada */}
              <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Equipe Organizada
                </h3>
                <p className="text-gray-600">
                  Controle de horários e especialidades de cada profissional.
                </p>
              </div>

              {/* Faturamento Simplificado */}
              <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Faturamento Simplificado
                </h3>
                <p className="text-gray-600">
                  Relatórios detalhados e integração com meios de pagamento.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                <Logo width={60} height={60} />
              </div>
              <p className="text-gray-400 text-sm mb-4">
                SaaS de agendamento e gestão para barbearias
              </p>
              <div className="flex justify-start">
                <a
                  href="https://instagram.com/noxora"
                  className="text-gray-400 hover:text-[#01ABFE] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Institutional Links */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Institucional
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/sobre" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Sobre nós
                  </a>
                </li>
                <li>
                  <a href="/#features" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="/planos" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Planos
                  </a>
                </li>
                <li>
                  <a href="/contato" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/termos" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/privacidade" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Política de Privacidade
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Suporte
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/ajuda" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="/status" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Status do Sistema
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400 text-sm">
              © 2025 Noxora. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
