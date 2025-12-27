import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Trade Finance with
              <span className="block text-orange-600 mt-2">Digital PTT Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Revolutionize working capital for exporters through Programmable Trade Token (PTT)
              discounting with instant liquidity and seamless bank-funder collaboration
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors shadow-lg"
              >
                Get Started
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -z-10 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-orange-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">Instant</div>
              <div className="text-orange-100">Liquidity Access</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5-15%</div>
              <div className="text-orange-100">Discount Rates</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-orange-100">Digital Process</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Secure</div>
              <div className="text-orange-100">Maker-Checker Workflow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Working Capital Challenge</h2>
            <p className="text-xl text-gray-600">Traditional trade finance creates cash flow problems for exporters</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Long Payment Cycles</h3>
              <p className="text-gray-600">Exporters wait 30-180 days for LC payments, creating cash flow gaps</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Limited Liquidity Options</h3>
              <p className="text-gray-600">No efficient secondary market to monetize trade instruments early</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Processes</h3>
              <p className="text-gray-600">Paper-based workflows slow down document verification and approvals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The PTT Discounting Solution</h2>
            <p className="text-xl text-gray-600">A digital platform connecting exporters, banks, and funders</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Liquidity</h3>
              <p className="text-gray-600">Convert PTTs to cash immediately by selling to funders at competitive discount rates</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Workflow</h3>
              <p className="text-gray-600">Bank-grade maker-checker approvals at every step ensure security and compliance</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Investment Opportunities</h3>
              <p className="text-gray-600">Funders earn attractive returns on short-term, bank-backed trade instruments</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, digital workflow from PTT issuance to settlement</p>
          </div>

          <div className="relative">
            {/* Timeline */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-orange-200"></div>

            {/* Steps */}
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div className="md:text-right">
                  <div className="inline-block bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    Step 1: PTT Issuance
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Bank Issues PTT</h3>
                  <p className="text-gray-600">
                    Importer requests PTT from DBS Bank. Bank's maker-checker workflow approves and issues
                    the PTT, then transfers it to the exporter's account.
                  </p>
                </div>
                <div className="hidden md:block"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div className="hidden md:block"></div>
                <div>
                  <div className="inline-block bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    Step 2: Document Verification
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Trade Documents</h3>
                  <p className="text-gray-600">
                    Exporter uploads shipping documents, invoices, and certificates. Bank's maker-checker
                    workflow verifies all documents for compliance.
                  </p>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div className="md:text-right">
                  <div className="inline-block bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    Step 3: PTT Discounting
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Offer for Discount</h3>
                  <p className="text-gray-600">
                    Exporter offers PTT to funders at a discount rate. Funder's maker-checker workflow
                    approves the purchase. Exporter receives immediate payment.
                  </p>
                </div>
                <div className="hidden md:block"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div className="hidden md:block"></div>
                <div>
                  <div className="inline-block bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    Step 4: Settlement
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Maturity Settlement</h3>
                  <p className="text-gray-600">
                    At maturity, DBS Bank's maker-checker workflow approves settlement with the funder.
                    Funder receives full PTT amount, earning the discount as return.
                  </p>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  4
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits by Role */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Benefits for Every Stakeholder</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Exporters */}
            <div className="bg-white rounded-lg p-8 shadow-md border-t-4 border-green-600">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Exporters</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Immediate working capital access</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">No waiting for payment cycles</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Competitive discount rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Digital document submission</span>
                </li>
              </ul>
            </div>

            {/* Funders */}
            <div className="bg-white rounded-lg p-8 shadow-md border-t-4 border-orange-600">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Funders</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Attractive short-term returns</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Bank-backed instruments</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Portfolio diversification</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Real-time portfolio tracking</span>
                </li>
              </ul>
            </div>

            {/* Banks */}
            <div className="bg-white rounded-lg p-8 shadow-md border-t-4 border-blue-600">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Banks</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Enhanced trade finance offerings</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Automated maker-checker workflows</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Digital document verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Complete audit trail</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise-Grade Security</h2>
            <p className="text-xl text-gray-600">Built with bank-level security and compliance</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Maker-Checker Workflow</h3>
                <p className="text-gray-600">
                  Every critical action requires dual approval - maker initiates, checker approves.
                  Bank-standard segregation of duties at every step.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Role-Based Access Control</h3>
                <p className="text-gray-600">
                  Granular permissions for exporters, importers, bank makers, bank checkers,
                  funder makers, and funder checkers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Audit Trail</h3>
                <p className="text-gray-600">
                  Every action tracked with timestamps and user details. Full compliance
                  with regulatory requirements and internal audits.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Document Storage</h3>
                <p className="text-gray-600">
                  Trade documents stored in encrypted cloud storage with access controls.
                  Support for PDF, images, and office documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Trade Finance?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join the digital revolution in PTT discounting and unlock working capital today
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-lg"
            >
              Get Started Now
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">PTT Platform</h3>
              <p className="text-sm">
                Digital platform for Programmable Trade Token discounting and trade finance.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-orange-400">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-orange-400">How It Works</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Pricing</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-orange-400">About Us</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Careers</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Contact</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-orange-400">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-orange-400">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2024 PTT Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
