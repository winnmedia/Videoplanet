import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/Common/b_logo.svg" 
                alt="브이래닛 로고" 
                className="h-8 w-auto"
              />
            </Link>
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">이용약관</h1>
          <p className="text-gray-600">최종 업데이트: 2024년 1월 1일</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
            <p className="text-gray-700 mb-4">
              이 약관은 윈앤미디어(이하 "회사")가 제공하는 브이래닛 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
            <div className="text-gray-700">
              <p className="mb-2">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>"서비스"라 함은 회사가 제공하는 영상 피드백 및 프로젝트 관리 플랫폼을 의미합니다.</li>
                <li>"이용자"라 함은 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이라 함은 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며, 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                <li>"비회원"이라 함은 회원에 가입하지 않고 서비스를 이용하는 자를 말합니다.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
              </p>
              <p>
                2. 회사는 합리적인 사유가 발생할 경우에는 이 약관을 변경할 수 있으며, 약관이 변경되는 경우 변경된 약관의 내용과 시행일을 명시하여 현행약관과 함께 서비스의 초기화면에 그 시행일 7일 이전부터 시행일 후 상당한 기간 동안 공지합니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제4조 (서비스의 제공 및 변경)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 회사가 제공하는 서비스는 다음과 같습니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>영상 피드백 및 협업 도구</li>
                <li>프로젝트 관리 서비스</li>
                <li>실시간 커뮤니케이션 기능</li>
                <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 이용자에게 제공하는 일체의 서비스</li>
              </ul>
              <p>
                2. 회사는 기술적 사양의 변경 등의 경우에는 장래에 제공하기로 한 서비스의 내용을 변경할 수 있습니다. 이 경우에는 변경된 서비스의 내용 및 제공일자를 명시하여 현재의 서비스의 내용을 게시한 곳에 즉시 공지합니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제5조 (서비스의 중단)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
              </p>
              <p>
                2. 회사는 국가비상사태, 정전, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 때에는 서비스의 전부 또는 일부를 제한하거나 정지할 수 있습니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제6조 (회원가입)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
              </p>
              <p>
                2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제7조 (개인정보보호)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 이용자들의 개인정보를 중요시하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법규를 준수하기 위해 노력합니다. 회사는 개인정보보호정책을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제8조 (이용자의 의무)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                이용자는 다음 행위를 하여서는 안 됩니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>신청 또는 변경시 허위내용의 등록</li>
                <li>타인의 정보도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제9조 (저작권의 귀속 및 이용제한)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.
              </p>
              <p>
                2. 이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제10조 (손해배상)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가 발생하더라도 동 손해가 회사의 중대한 과실에 의한 경우를 제외하고 이에 대하여 책임을 부담하지 아니합니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제11조 (면책조항)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              </p>
              <p>
                2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제12조 (준거법 및 관할법원)</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                1. 이 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국의 법을 적용합니다.
              </p>
              <p>
                2. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              문의사항이 있으시면 고객센터로 연락해주세요.
            </p>
            <Link 
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}