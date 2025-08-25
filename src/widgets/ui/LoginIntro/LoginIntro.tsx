'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from './LoginIntro.module.scss'

export function LoginIntro() {
  const router = useRouter()
  
  return (
    <div className={styles.LoginIntro}>
      <div className={styles.intro_wrap}>
        <h1 className={styles.logo}>
          <Image 
            onClick={() => router.push('/')} 
            src="/images/Common/w_logo02.svg" 
            alt="VLANET"
            width={120}
            height={40}
            priority
            style={{ cursor: 'pointer' }}
          />
        </h1>
        <div className={styles.slogun}>
          당신의 창의력에
          <br />
          날개를 달아 줄<br />
          <span>콘텐츠 제작 협업툴</span>
        </div>
        <div className={`${styles.etc} ${styles.flex} ${styles.space_between} ${styles.align_center}`}>
          <ul>
            <li>
              Connect
              <br /> with each other
            </li>
            <li>
              Easy
              <br /> Feedback
            </li>
            <li>
              Study
              <br /> Together
            </li>
          </ul>
          <div>
            vlanet to
            <br /> connection
          </div>
        </div>
      </div>
    </div>
  )
}