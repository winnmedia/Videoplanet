'use client'

import { useRouter } from 'next/navigation'
import './Home.scss'

export default function Home() {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div id="Home">
      <section id="header">
        <div className="inner flex space_between align_center">
          <h1 className="logo">
            <img src="/images/Common/w_logo02.svg" alt="브이래닛 로고" />
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
            <button 
              onClick={() => handleNavigation('/login')} 
              className="submit"
            >
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
            이제는 <span>'브이래닛'</span>으로 쉬워집니다
          </p>
        </section>

        <section className="feedback function">
          <div className="inner">
            <h2>
              <span>Easy Feedback</span>
            </h2>
            <div className="content">
              <div className="txt">
                <div>
                  <span>쉽고, 정확하고, 편한</span>
                  영상 피드백
                </div>
                <p>
                  영상을 같이 보며 정확하게 피드백하고 전문성을 높여보세요! 영상
                  수정 횟수가 절반으로 줄어들어요.
                </p>
                <p>
                  영상 피드백은 익명일 때 가장 효과적입니다. 이제 익명으로
                  피드백해보세요!
                </p>
                <button 
                  onClick={() => handleNavigation('/login')} 
                  className="submit"
                >
                  바로가기
                </button>
              </div>
              <div className="img">
                <img src="/images/Home/new/feedback-img.png" alt="피드백 기능" />
              </div>
            </div>
          </div>
        </section>

        <section className="project function">
          <div className="inner">
            <h2>
              <span>Project Management</span>
            </h2>
            <div className="content">
              <div className="txt">
                <div>
                  <span>조연출이 필요없는</span>
                  프로젝트 관리
                </div>
                <p>
                  오늘 어떤 프로젝트가 진행되는지 쉽게 추적하고, 앞으로 해야 할
                  일이 무엇인지 정확하게 알려줍니다.
                </p>
                <button 
                  onClick={() => handleNavigation('/login')} 
                  className="submit"
                >
                  바로가기
                </button>
              </div>
              <div className="img">
                <img src="/images/Home/new/project-img.png" alt="프로젝트 관리" />
              </div>
            </div>
          </div>
        </section>

        <section className="comment function">
          <div className="inner">
            <h2>
              <span>Live Comment</span>
            </h2>
            <div className="content">
              <div className="txt">
                <div>
                  <span>비대면 미팅이 가능한</span>
                  라이브 코멘트
                </div>
                <p>
                  라이브코멘트 기능을 통해 영상을 보면서 실시간 미팅이
                  가능합니다.
                </p>
                <button 
                  onClick={() => handleNavigation('/login')} 
                  className="submit"
                >
                  바로가기
                </button>
              </div>
              <div className="img">
                <img src="/images/Home/new/comment-img.png" alt="라이브 코멘트" />
              </div>
            </div>
          </div>
        </section>

        <section className="background">
          <div className="inner">
            <h2>
              <span>Background</span>
            </h2>
            <div className="group flex space_between">
              <div className="txt_box">
                <span>01</span>
                서로 다른 프로그램을
                <br />
                써가며 번거롭게 나누던
                <b>
                  콘텐츠 제작 협업에 대한 <br />
                  새로운 답을 제시합니다
                </b>
              </div>
              <div className="ex">
                <div className="part flex space_between align_center">
                  <div className="img">
                    <img src="/images/Home/emoji01.png" className="img01" alt="영상 디자이너" />
                  </div>
                  <div className="text">
                    <div>
                      <span>
                        <i>
                          <img src="/images/Home/chat_icon.png" alt="채팅" />
                        </i>
                        영상 디자이너 L
                      </span>
                    </div>
                    <p>
                      피드백을 이해하기가 어려워..
                      <br />
                      <b>한 눈에 빠르고 쉽게 파악할 수 있는 툴은 없을까?</b>
                    </p>
                  </div>
                </div>
                <div className="part flex space_between align_center mt50">
                  <div className="text">
                    <div>
                      <span>
                        <i>
                          <img src="/images/Home/chat_icon.png" alt="채팅" />
                        </i>
                        콘텐츠 기획자 P
                      </span>
                    </div>
                    <p>
                      파워포인트,그림판,한글.. 이런 프로그램 말고,
                      <br />
                      <b>영상 콘텐츠 협업만을 위한 툴은 없을까?</b>
                    </p>
                  </div>
                  <div className="img">
                    <img src="/images/Home/emoji03.png" className="img01" alt="콘텐츠 기획자" />
                  </div>
                </div>
              </div>
            </div>
            <div className="group flex space_between mt100">
              <div className="txt_box">
                <span>02</span>
                주먹구구식 영상 제작은
                <br />
                이제 그만 !
                <b>
                  정확하고 빠른 업무체계로 <br />
                  영상 제작에 투입되는 입력과 <br />
                  시간을 줄일 수 있습니다.
                </b>
              </div>
              <div className="ex">
                <div className="part flex space_between align_center">
                  <div className="img">
                    <img src="/images/Home/emoji02.png" className="img01" alt="영상 제작 꿈나무" />
                  </div>
                  <div className="text">
                    <div>
                      <span>
                        <i>
                          <img src="/images/Home/chat_icon.png" alt="채팅" />
                        </i>
                        영상 제작 꿈나무 K
                      </span>
                    </div>
                    <p>
                      어떻게 영상 제작을 시작해야 할지 모르겠어..
                      <br />
                      <b>전문가가 꼼꼼하게 알려주는 클래스 없을까?</b>
                    </p>
                  </div>
                </div>
                <div className="part flex space_between align_center mt50">
                  <div className="text">
                    <div>
                      <span>
                        <i>
                          <img src="/images/Home/chat_icon.png" alt="채팅" />
                        </i>
                        영상디자인학과 학생 J
                      </span>
                    </div>
                    <p>
                      현장에서는 영상을 어떻게 제작할까?
                      <br />
                      <b>실무 스킬,콘텐츠 제작 프로세스를 배우고 싶어..</b>
                    </p>
                  </div>
                  <div className="img">
                    <img src="/images/Home/emoji04.png" className="img02" alt="영상디자인학과 학생" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="video">
          <div className="inner">
            <h2>
              <span>
                How to get started <br />
                with 브이래닛
              </span>
            </h2>
            <div className="video-wrap">
              <iframe
                width="1000"
                height="461"
                src="https://www.youtube.com/embed/nBH02NxZRfI"
                title="실제 고객이 말하는 세이프홈즈, 고객의 리얼 스토리"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>

        <section className="end">
          <div className="inner">
            <div className="txt">
              세상 모든 <br />
              크리에이터들의
              <br />
              <span>행복한 행성을</span>
              <br />
              <span>만들어 갑니다.</span>
            </div>
            <div className="img">
              <img src="/images/Home/new/end-img.png" alt="행복한 행성" />
            </div>
          </div>
          <div className="ment">
            SAVE THE CREATORS <img src="/images/Home/new/end-img02.png" alt="행성" />
          </div>
        </section>
      </section>

      <section id="footer">
        <div className="inner flex space_between align_center">
          <div>
            <div className="logo">
              <img src="/images/Common/w_logo02.svg" alt="브이래닛" />
            </div>
            <ul>
              <li>윈앤미디어</li>
              <li>대전광역시 서구 청사로 228 청사오피스</li>
              <li>사업자등록번호 : 725-08-01986</li>
              <li>대표자 : 유석근 </li>
              <li>전화번호 : 000-000-0000</li>
            </ul>
            <div>
              <span onClick={() => handleNavigation('/terms')}>이용약관</span>
              <span onClick={() => handleNavigation('/privacy')}>
                개인정보 취급방침
              </span>
            </div>
          </div>

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
        </div>
      </section>
    </div>
  )
}