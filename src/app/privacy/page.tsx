import Link from 'next/link'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">개인정보 취급방침</h1>
          <p className="text-gray-600">최종 업데이트: 2024년 1월 1일</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 개인정보의 수집 및 이용목적</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                윈앤미디어(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">가. 회원가입 및 관리</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>회원 가입의사 확인</li>
                <li>개인 식별</li>
                <li>회원자격 유지·관리</li>
                <li>서비스 부정이용 방지</li>
                <li>각종 고지·통지</li>
                <li>고충처리</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">나. 서비스 제공</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>영상 피드백 서비스 제공</li>
                <li>프로젝트 관리 서비스 제공</li>
                <li>콘텐츠 제공</li>
                <li>맞춤형 서비스 제공</li>
                <li>본인인증</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">다. 마케팅 및 광고에의 활용</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>신규 서비스(제품) 개발 및 맞춤 서비스 제공</li>
                <li>이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
                <li>인구통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                <li>서비스의 유효성 확인</li>
                <li>접속빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 개인정보의 수집항목 및 수집방법</h2>
            <div className="text-gray-700 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">가. 수집항목</h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">필수항목:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>이메일주소</li>
                  <li>비밀번호</li>
                  <li>이름</li>
                  <li>휴대전화번호</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">선택항목:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>프로필 사진</li>
                  <li>회사명</li>
                  <li>직책</li>
                  <li>관심분야</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">자동수집항목:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP주소</li>
                  <li>쿠키</li>
                  <li>방문일시</li>
                  <li>서비스 이용기록</li>
                  <li>불량 이용기록</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">나. 수집방법</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>홈페이지, 서면양식, 팩스, 전화, 상담게시판, 이메일</li>
                <li>협력회사로부터의 제공</li>
                <li>생성정보 수집 툴을 통한 수집</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 개인정보의 처리 및 보유기간</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>회원가입 및 관리:</strong> 회원탈퇴시까지</li>
                  <li><strong>서비스 제공:</strong> 서비스 이용계약 해지시까지</li>
                  <li><strong>마케팅 및 광고:</strong> 동의철회시까지</li>
                  <li><strong>법령에 따른 보존:</strong> 관련 법령에서 정한 기간</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 개인정보의 제3자 제공</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-800">
                  현재 회사는 개인정보를 제3자에게 제공하고 있지 않습니다.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 개인정보처리의 위탁</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        위탁받는 자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        위탁하는 업무의 내용
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        위탁기간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        클라우드 서비스 제공업체
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        데이터 저장 및 관리
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        서비스 제공 기간
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>개인정보 처리현황 통지요구</li>
                <li>개인정보 열람요구</li>
                <li>개인정보 오류 등이 있을 경우 정정·삭제요구</li>
                <li>개인정보 처리정지요구</li>
              </ul>

              <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                <p className="text-yellow-800">
                  <strong>권리 행사 방법:</strong> 위의 권리 행사는 회사에 대해 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 개인정보의 파기</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">파기절차 및 방법</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>파기절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
                <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 개인정보 보호책임자</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">개인정보 보호책임자</h3>
                <ul className="space-y-2">
                  <li><strong>성명:</strong> 유석근</li>
                  <li><strong>직책:</strong> 대표이사</li>
                  <li><strong>연락처:</strong> 000-000-0000</li>
                  <li><strong>이메일:</strong> privacy@videoplanet.com</li>
                </ul>
              </div>

              <p className="mt-4">
                정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체없이 답변 및 처리해드릴 것입니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 개인정보 처리방침 변경</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 개인정보의 안전성 확보조치</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>개인정보처리시스템 등의 접근권한 관리</li>
                <li>개인정보의 암호화</li>
                <li>해킹 등에 대비한 기술적 대책</li>
                <li>개인정보에 대한 접근 제한</li>
                <li>개인정보를 처리하는 직원의 최소화 및 교육</li>
                <li>개인정보보호전담기구의 운영</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              개인정보 관련 문의사항이 있으시면 개인정보 보호책임자에게 연락해주세요.
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