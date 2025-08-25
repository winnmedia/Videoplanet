import './Home.scss'

export default function HomeTest() {
  return (
    <div id="Home">
      <section id="header">
        <div className="inner flex space_between align_center">
          <h1 className="logo">
            <img src="/images/Common/w_logo02.svg" alt="Vlanet 로고" />
          </h1>
          <div className="etc">
            <ul>
              <li>
                <a
                  href="https://www.youtube.com/channel/UC33mItthSPySgXc24SiXH2A"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  유튜브
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/vlanet_official/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  인스타그램
                </a>
              </li>
            </ul>
            <button className="submit">
              로그인
            </button>
          </div>
        </div>
      </section>

      <section id="container">
        <section className="visual">
          <div className="inner">
            <div className="txt">
              영상 콘텐츠
              <br />
              협업의 신.세.계
              <br />
              <span>브이래닛으로</span>
              <br />
              <span>당장 이주하세요!</span>
              <p>
                쉽고 정확한 영상 피드백 툴<br />
                한 눈에 파악할 수 있는 프로젝트 진행 단계
                <br />
                다양한 문서 양식으로 영상 제작 전문성 UP!
              </p>
            </div>
            <div className="img">
              <img src="/images/Home/new/visual-img.png" alt="영상 협업 툴" />
            </div>
          </div>
        </section>

        <section className="textbox">
          <img src="/images/Home/new/tool02.png" alt="툴 비교" />
          <div>번거로운 n가지 툴 사용은 이제 그만,</div>
          <p>
            영상 편집 피드백, 프로젝트 관리가 까다로우셨나요? <br />
            이제는 <span>'브이래닛'</span>로 쉬워집니다
          </p>
        </section>
      </section>

      <section id="footer">
        <div className="inner flex space_between align_center">
          <div>
            <div className="logo">
              <img src="/images/Common/w_logo02.svg" alt="Vlanet" />
            </div>
            <ul>
              <li>윈앤미디어</li>
              <li>대전광역시 서구 청사로 228 청사오피스</li>
              <li>사업자등록번호 : 725-08-01986</li>
              <li>대표자 : 유석근 </li>
              <li>전화번호 : 000-000-0000</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}