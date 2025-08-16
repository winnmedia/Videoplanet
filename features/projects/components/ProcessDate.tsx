/**
 * 프로젝트 일정 관리 컴포넌트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

'use client';

import React, { memo, forwardRef, useCallback } from 'react';
// @ts-ignore - Missing type declarations for react-datepicker
import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css'; // Temporarily disabled for build compatibility
import { ko } from 'date-fns/esm/locale';
import type { ProcessDateProps, ProjectDateRange } from '../types';

// 프로젝트 단계 정보
const PROJECT_PHASES = [
  { key: 'basic_plan', text: '기초기획안 작성' },
  { key: 'story_board', text: '스토리보드 작성' },
  { key: 'filming', text: '촬영 (계획/진행)' },
  { key: 'video_edit', text: '비디오 편집' },
  { key: 'post_work', text: '후반 작업' },
  { key: 'video_preview', text: '비디오 시사 (피드백)' },
  { key: 'confirmation', text: '최종 컨펌' },
  { key: 'video_delivery', text: '영상 납품' },
];

/**
 * 커스텀 날짜 선택 입력 컴포넌트
 */
interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ExampleCustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value, onClick, placeholder, disabled = false }, ref) => (
    <button
      type="button"
      className={`example-custom-input ${value ? '' : 'off'} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      ref={ref}
      disabled={disabled}
      aria-label={placeholder}
    >
      {value || placeholder}
    </button>
  )
);

ExampleCustomInput.displayName = 'ExampleCustomInput';

/**
 * 프로젝트 일정 관리 컴포넌트
 */
const ProcessDate: React.FC<ProcessDateProps> = ({
  process,
  set_process,
  disabled = false,
}) => {
  // 날짜 변경 핸들러
  const handleDateChange = useCallback(
    (index: number, key: keyof ProjectDateRange, value: Date | null) => {
      const updatedProcess = [...process];
      updatedProcess[index] = { 
        startDate: updatedProcess[index]?.startDate || null,
        endDate: updatedProcess[index]?.endDate || null,
        phase_name: updatedProcess[index]?.phase_name || '',
        ...updatedProcess[index], 
        [key]: value 
      };

      // 시작 날짜가 변경되고 종료 날짜가 없는 경우, 종료 날짜를 초기화하지 않음
      if (key === 'startDate' && updatedProcess[index].endDate) {
        // 시작 날짜가 종료 날짜보다 늦은 경우 종료 날짜를 시작 날짜로 설정
        if (value && updatedProcess[index].endDate && value > updatedProcess[index].endDate!) {
          updatedProcess[index] = {
            ...updatedProcess[index],
            endDate: value,
          };
        }
      }

      set_process(updatedProcess);
    },
    [process, set_process]
  );

  // 종료 날짜 필터 (시작 날짜 이후만 선택 가능)
  const filterEndDate = useCallback(
    (date: Date, index: number) => {
      const startDate = process[index]?.startDate;
      if (!startDate) return false;

      const startDateOnly = new Date(startDate).setHours(0, 0, 0, 0);
      const currentDate = new Date(date).setHours(0, 0, 0, 0);
      return startDateOnly <= currentDate;
    },
    [process]
  );

  // 종료 시간 필터 (시작 날짜와 같은 날인 경우 시작 시간 이후만 선택 가능)
  const filterEndTime = useCallback(
    (time: Date, index: number) => {
      const startDate = process[index]?.startDate;
      if (!startDate) return false;

      // 같은 날인 경우에만 시간 필터 적용
      const startDateOnly = new Date(startDate).setHours(0, 0, 0, 0);
      const timeDateOnly = new Date(time).setHours(0, 0, 0, 0);
      
      if (startDateOnly === timeDateOnly) {
        return new Date(startDate) < new Date(time);
      }
      
      return true;
    },
    [process]
  );

  return (
    <ul className="dataprocess">
      {process.map((range, index) => {
        const phaseInfo = PROJECT_PHASES[index] || { text: `단계 ${index + 1}` };
        
        return (
          <li key={index}>
            <div className="type">{phaseInfo.text}</div>
            
            {/* 시작 날짜 선택 */}
            <div className="select start">
              <DatePicker
                locale={ko}
                placeholderText="시작 날짜"
                selected={range.startDate}
                onChange={(date: Date | null) => handleDateChange(index, 'startDate', date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={10}
                dateFormat="yyyy-MM-dd HH:mm"
                customInput={
                  <ExampleCustomInput
                    placeholder="시작 날짜"
                    disabled={disabled}
                  />
                }
                disabled={disabled}
                aria-label={`${phaseInfo.text} 시작 날짜`}
              />
            </div>

            {/* 종료 날짜 선택 */}
            <div className="select end">
              <DatePicker
                locale={ko}
                placeholderText="종료 날짜"
                selected={range.endDate}
                onChange={(date: Date | null) => handleDateChange(index, 'endDate', date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={10}
                dateFormat="yyyy-MM-dd HH:mm"
                disabled={!range.startDate || disabled}
                filterDate={(date: Date) => filterEndDate(date, index)}
                filterTime={(time: Date) => filterEndTime(time, index)}
                customInput={
                  <ExampleCustomInput
                    placeholder="종료 날짜"
                    disabled={!range.startDate || disabled}
                  />
                }
                aria-label={`${phaseInfo.text} 종료 날짜`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

ProcessDate.displayName = 'ProcessDate';

export default memo(ProcessDate);