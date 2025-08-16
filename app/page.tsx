'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import '@/css/Common.scss'
import '@/css/Home.scss'

// Static imports for images
import logo from '@/assets/images/Common/w_logo.svg'
import icon01 from '@/assets/images/Home/icon01.svg'
import icon02 from '@/assets/images/Home/icon02.svg'
import icon03 from '@/assets/images/Home/icon03.svg'
import icon04 from '@/assets/images/Home/icon04.svg'
import chat from '@/assets/images/Home/chat_icon.png'
import emoji01 from '@/assets/images/Home/emoji01.png'
import emoji02 from '@/assets/images/Home/emoji02.png'
import emoji03 from '@/assets/images/Home/emoji03.png'
import emoji04 from '@/assets/images/Home/emoji04.png'
import img08 from '@/assets/images/Home/img08.png'
import img09 from '@/assets/images/Home/img09.png'
import img10 from '@/assets/images/Home/img10.png'

import tool from '@/assets/images/Home/new/tool.png'
import tool02 from '@/assets/images/Home/new/tool02.png'
import visual from '@/assets/images/Home/new/visual-img.png'
import feedback from '@/assets/images/Home/new/feedback-img.png'
import project from '@/assets/images/Home/new/project-img.png'
import comment from '@/assets/images/Home/new/comment-img.png'
import identity from '@/assets/images/Home/new/identity-img.png'
import identity02 from '@/assets/images/Home/new/identity-img02.png'
import identity03 from '@/assets/images/Home/new/identity-img03.png'
import identity04 from '@/assets/images/Home/new/identity-img04.png'
import end from '@/assets/images/Home/new/end-img.png'
import end02 from '@/assets/images/Home/new/end-img02.png'

export default function HomePage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  
  // Hydration 완료 후 클라이언트 상태로 설정
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const handleLoginClick = () => {
    if (isClient) {
      router.push('/login')
    }
  }
  
  const handleTermsClick = () => {
    if (isClient) {
      router.push('/terms')
    }
  }
  
  const handlePrivacyClick = () => {
    if (isClient) {
      router.push('/privacy')
    }
  }

  return (
    <div id="Home">
      <section id="header">
        <div className="inner flex space_between align_center">
          <h1 className="logo">
            <Image src={logo} alt="Vlanet Logo" />
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
            <button onClick={handleLoginClick} className="submit">
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
              <Image src={visual} alt="Visual content" />
            </div>
          </div>
        </section>

        <section className="textbox">
          <Image src={tool02} alt="Tool illustration" />
          <div>번거로운 n가지 툴 사용은 이제 그만,</div>
          <p>
            영상 편집 피드백, 프로젝트 관리가 까다로우셨나요? <br />
            이제는 <span>'브이래닛'</span>로 쉬워집니다
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
                <button onClick={handleLoginClick} className="submit">
                  바로가기
                </button>
              </div>
              <div className="img">
                <Image src={feedback} alt="Feedback feature" />
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
                <button onClick={handleLoginClick} className="submit">
                  바로가기
                </button>
              </div>
              <div className="img">
                <Image src={project} alt="Project management" />
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
                <button onClick={handleLoginClick} className="submit">
                  바로가기
                </button>
              </div>
              <div className="img">
                <Image src={comment} alt="Live comment feature" />
              </div>
            </div>
          </div>
        </section>

        <section className="contents function">
          <div className="inner">
            <h2>
              <span>Contents</span>
            </h2>
            <div className="content">
              <div className="txt">
                <div>
                  <span>상세하고 체계적으로</span>
                  비법으로 학습
                </div>
                <p>
                  주먹구구식 작업은 이제 그만하세요! <br />
                  체계적으로 영상을 만드는 방법을 알려드려요. <br />
                  고수의 제작 방법을 이용해보세요!
                </p>
                <button onClick={handleLoginClick} className="submit">
                  바로가기
                </button>
              </div>
              <div className="list">
                <ul>
                  <li>
                    <div className="mask"></div>
                    <div className="text">
                      유튜브 시작 전 <br />
                      봐야하는 영상
                    </div>
                  </li>
                  <li>
                    <div className="mask"></div>
                    <div className="text">
                      촬영 ! 이것만 <br />
                      알고 가자 !
                    </div>
                  </li>
                  <li>
                    <div className="mask"></div>
                    <div className="text">
                      스토리 만드는 <br />
                      방법 3가지
                    </div>
                  </li>
                  <li>
                    <div className="mask"></div>
                    <div className="text">
                      캐릭터는 어떻게 <br />
                      만들어야 할까?
                    </div>
                  </li>
                  <li>
                    <div className="mask"></div>
                    <div className="text">
                      영상 만들 때
                      <br />
                      실수 BEST 5
                    </div>
                  </li>
                  <li>
                    <div className="mask"></div>
                    <div className="text">
                      영상 만드는 과정을 <br />
                      기록해야하는 이유
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="identity">
          <div className="inner">
            <h2>
              <span>Brand Identity</span>
            </h2>
            <ul>
              <li>
                <div className="img">
                  <Image src={identity} alt="Easy Management" />
                </div>
                <div className="txt">Easy Management</div>
              </li>
              <li>
                <div className="img">
                  <Image src={identity02} alt="Fast and Accurate Feedback" />
                </div>
                <div className="txt">Fast and Accurate Feedback</div>
              </li>
              <li>
                <div className="img">
                  <Image src={identity03} alt="Study Together" />
                </div>
                <div className="txt">Study Together</div>
              </li>
              <li>
                <div className="img">
                  <Image src={identity04} alt="Convenient Meeting" />
                </div>
                <div className="txt">Convenient Meeting</div>
              </li>
            </ul>
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
                    <Image src={emoji01} className="img01" alt="Designer emoji" />
                  </div>
                  <div className="text">
                    <div>
                      <span>
                        <i>
                          <Image src={chat} alt="Chat icon" />
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
                          <Image src={chat} alt="Chat icon" />
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
                    <Image src={emoji03} alt="Planner emoji" />
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
                    <Image src={emoji02} className="img01" alt="Student emoji" />
                  </div>
                  <div className="text">
                    <div>
                      <span>
                        <i>
                          <Image src={chat} alt="Chat icon" />
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
                          <Image src={chat} alt="Chat icon" />
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
                    <Image src={emoji04} className="img02" alt="Student emoji 2" />
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
                with Vlanet
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
              <Image src={end} alt="Save the creators" />
            </div>
          </div>
          <div className="ment">
            SAVE THE CREATORS <Image src={end02} alt="Planet icon" />
          </div>
        </section>
      </section>

      <section id="footer">
        <div className="inner flex space_between align_center">
          <div>
            <div className="logo">vlanet</div>
            <ul>
              <li>윈앤미디어</li>
              <li>대전광역시 서구 청사로 228 청사오피스</li>
              <li>사업자등록번호 : 725-08-01986</li>
              <li>대표자 : 유석근 </li>
              <li>전화번호 : 000-000-0000</li>
            </ul>
            <div>
              <span onClick={handleTermsClick}>이용약관</span>
              <span onClick={handlePrivacyClick}>
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