/**
 * CalendarDate Component
 * 개별 날짜 셀 렌더링 및 이벤트 처리
 */

'use client';

import React, { useState, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import moment from 'moment';
// import 'moment/locale/ko'; // Temporarily disabled for build compatibility
import cx from 'classnames';
// @ts-ignore - Missing type declarations for react-datepicker
import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css'; // Temporarily disabled for build compatibility

import CalendarModal from './CalendarModal';
import { CalendarDateProps, ProjectSchedule, CalendarMemo } from '../types';
import calendarApi from '../api/calendarApi';

// ========================
// 타입 정의
// ========================

interface LegacyCalendarDateProps {
  index: number;
  week?: Date[];
  month: number;
  year: number;
  type: string;
  day?: Date;
  current_project?: any;
  project_list: any[];
  user_memos: any[];
  is_admin: boolean;
  refetch: () => void;
}

interface DateCellProps extends Omit<LegacyCalendarDateProps, 'week' | 'day'> {
  day: Date;
}

// ========================
// 개별 날짜 셀 컴포넌트
// ========================

const DateCell: React.FC<DateCellProps> = ({
  day,
  month,
  year,
  current_project,
  project_list,
  user_memos,
  is_admin,
  refetch,
}) => {
  const router = useRouter();
  const params = useParams();
  const project_id = params?.project_id as string;
  
  // ========================
  // 상태 관리
  // ========================
  
  const [onInputModal, setInputModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [dateInput, setDateInput] = useState<any>(null);
  const [onModal, setModal] = useState<any>(null);
  const [memo, setMemo] = useState('');

  // ========================
  // 헬퍼 함수
  // ========================
  
  const dateInfoStyle = () => {
    const holiday = day.getDay() === 0 || day.getDay() === 6;
    const preOrNext = 
      day.getMonth() < month ||
      day.getFullYear() < year ||
      day.getMonth() > month ||
      day.getFullYear() > year;
    
    const opacity = { opacity: preOrNext ? '0.3' : '1' };
    const color = { color: holiday ? 'red' : '#000' };
    
    return { style: { ...opacity, ...color } };
  };

  const setDate = (date: string | Date) => {
    return new Date(date).setHours(0, 0, 0, 0);
  };

  const classValid = (date: number) => {
    return date === day.setHours(0, 0, 0, 0);
  };

  const isToday = 
    day.getMonth() === new Date().getMonth() &&
    day.getFullYear() === new Date().getFullYear() &&
    day.getDate() === new Date().getDate();

  // ========================
  // 이벤트 핸들러
  // ========================
  
  const handleMemoSubmit = async () => {
    if (memo.length === 0) {
      alert('메모를 작성해주세요.');
      return;
    }

    try {
      const memoData = {
        date: `${year}-${month + 1}-${day.getDate()}`,
        memo: memo,
      };

      if (is_admin && project_id) {
        await calendarApi.createProjectMemo(memoData, parseInt(project_id));
      } else if (window.location.pathname.includes('/calendar')) {
        await calendarApi.createUserMemo(memoData);
      }

      setMemo('');
      refetch();
      setInputModal(false);
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('메모 작성에 실패했습니다.');
      }
    }
  };

  const handleMemoDelete = async (memoToDelete: any) => {
    try {
      if (is_admin && project_id) {
        await calendarApi.deleteProjectMemo(memoToDelete.id, parseInt(project_id));
      } else if (window.location.pathname.includes('/calendar')) {
        await calendarApi.deleteUserMemo(memoToDelete.id);
      }

      refetch();
      setDetailModal(null);
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('메모 삭제에 실패했습니다.');
      }
    }
  };

  const handlePhaseUpdate = async () => {
    if (!dateInput.start_date || !dateInput.end_date) {
      alert('날짜를 입력해주세요.');
      return;
    }

    if (new Date(dateInput.start_date) >= new Date(dateInput.end_date)) {
      alert('종료 날짜는 시작 날짜보다 늦어야 합니다.');
      return;
    }

    try {
      await calendarApi.updateProjectPhase({
        projectId: parseInt(project_id),
        phaseKey: dateInput.phase_key,
        startDate: new Date(dateInput.start_date),
        endDate: new Date(dateInput.end_date),
      });

      refetch();
      setDateInput(null);
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('일정 변경에 실패했습니다.');
      }
    }
  };

  const filterPastDates = (date: Date) => {
    const today = new Date();
    return date >= today || date.toDateString() === today.toDateString();
  };

  // ========================
  // 프로젝트 단계 렌더링
  // ========================
  
  const renderProjectPhases = () => {
    if (!current_project) return null;

    const phases = [
      { key: 'basic_plan', name: '기초기획안 작성', className: 'first' },
      { key: 'story_board', name: '스토리보드 작성', className: 'second' },
      { key: 'filming', name: '촬영(계획/진행)', className: 'third' },
      { key: 'video_edit', name: '비디오 편집', className: 'fourth' },
      { key: 'post_work', name: '후반 작업', className: 'fifth' },
      { key: 'video_preview', name: '비디오 시사', className: 'sixth' },
      { key: 'confirmation', name: '최종 컨펌', className: 'seven' },
      { key: 'video_delivery', name: '영상 납품', className: 'eighth' },
    ];

    return phases.map(phase => {
      const phaseData = current_project[phase.key];
      
      if (!phaseData?.start_date || !phaseData?.end_date) {
        return <span key={phase.key}></span>;
      }

      const startDate = setDate(phaseData.start_date);
      const endDate = setDate(phaseData.end_date);
      const currentDate = setDate(day);

      if (currentDate < startDate || currentDate > endDate) {
        return <span key={phase.key}></span>;
      }

      return (
        <React.Fragment key={phase.key}>
          <span
            onClick={() => {
              if (is_admin) {
                setDateInput({ ...phaseData, phase_key: phase.key });
              }
            }}
            onMouseOver={() => setModal(phase.name)}
            onMouseLeave={() => setModal(null)}
            style={{ cursor: is_admin ? 'pointer' : 'auto' }}
            className={cx(phase.className, {
              start: classValid(startDate),
              end: classValid(endDate),
            })}
          />
          {onModal === phase.name && (
            <div className="Modal">{onModal}</div>
          )}
        </React.Fragment>
      );
    });
  };

  // ========================
  // 프로젝트 목록 렌더링
  // ========================
  
  const renderProjectList = () => {
    if (!project_list) return null;

    return project_list.map((project, index) => {
      const startDate = setDate(project.first_date);
      const endDate = setDate(project.end_date);
      const currentDate = setDate(day);

      if (currentDate < startDate || currentDate > endDate) {
        return <span key={index}></span>;
      }

      return (
        <React.Fragment key={index}>
          <span
            onMouseOver={() => setModal(index)}
            onMouseLeave={() => setModal(null)}
            onClick={() => router.push(`/projects/${project.id}/view`)}
            className={cx({
              start: classValid(startDate),
              end: classValid(endDate),
            })}
            style={{ background: project.color, cursor: 'pointer' }}
          />
          {onModal === index && (
            <div className="Modal">{project.name}</div>
          )}
        </React.Fragment>
      );
    });
  };

  // ========================
  // 메모 렌더링
  // ========================
  
  const renderMemos = () => {
    const allMemos = [
      ...(current_project?.memo || []),
      ...(user_memos || [])
    ];

    return allMemos.map((memoItem, index) => {
      if (setDate(memoItem.date) !== setDate(day)) {
        return null;
      }

      return (
        <span
          key={index}
          className="memo"
          onClick={() => setDetailModal(memoItem)}
          style={{ color: '#23262d', cursor: 'pointer' }}
        >
          {memoItem.memo}
        </span>
      );
    });
  };

  // ========================
  // 모달 컴포넌트들
  // ========================
  
  const inputModal = onInputModal && (
    <CalendarModal
      visible={true}
      ModalTitle={<></>}
      ModalText={
        <div>
          <div className="day">
            {year}년 {month + 1}월 {day.getDate()}일
          </div>
          <textarea
            className="mt20"
            name="textarea"
            placeholder="메모를 입력해주세요."
            cols={30}
            rows={10}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <div className="btn_wrap">
            <button className="submit" onClick={handleMemoSubmit}>
              등록
            </button>
            <button className="cancel" onClick={() => setInputModal(false)}>
              닫기
            </button>
          </div>
        </div>
      }
    />
  );

  const detailModalComponent = detailModal && (
    <CalendarModal
      visible={true}
      ModalTitle={<></>}
      ModalText={
        <div>
          <div className="memo_txt">{detailModal.memo}</div>
          <div className="btn_wrap">
            {(is_admin || window.location.pathname.includes('/calendar')) && (
              <button
                className="submit"
                onClick={() => handleMemoDelete(detailModal)}
              >
                삭제
              </button>
            )}
            <button onClick={() => setDetailModal(null)} className="cancel">
              닫기
            </button>
          </div>
        </div>
      }
    />
  );

  const updateModal = dateInput && (
    <CalendarModal
      visible={true}
      ModalTitle={<></>}
      ModalText={
        <div>
          <div className="selec_wrap">
            <div className="select">
              <DatePicker
                placeholderText="시작 날짜"
                selected={dateInput.start_date ? new Date(dateInput.start_date) : null}
                onChange={(date: Date | null) =>
                  setDateInput({ ...dateInput, start_date: date })
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={10}
                dateFormat="yyyy-MM-dd HH:mm"
                filterDate={filterPastDates}
              />
            </div>
            <div className="select">
              <DatePicker
                placeholderText="종료 날짜"
                filterDate={(date: Date) => {
                  const startDate = new Date(dateInput.start_date).setHours(0, 0, 0, 0);
                  const currentDate = new Date(date);
                  return startDate <= currentDate.getTime() && filterPastDates(date);
                }}
                selected={dateInput.end_date ? new Date(dateInput.end_date) : null}
                onChange={(date: Date | null) =>
                  setDateInput({ ...dateInput, end_date: date })
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={10}
                dateFormat="yyyy-MM-dd HH:mm"
                disabled={!dateInput.start_date}
              />
            </div>
          </div>
          <div className="btn_wrap">
            <button className="submit" onClick={handlePhaseUpdate}>
              변경하기
            </button>
            <button className="cancel" onClick={() => setDateInput(null)}>
              닫기
            </button>
          </div>
        </div>
      }
    />
  );

  // ========================
  // 메인 렌더링
  // ========================
  
  return (
    <div {...dateInfoStyle()}>
      {inputModal}
      {detailModalComponent}
      {updateModal}
      
      <p
        style={{
          cursor: (is_admin || window.location.pathname.includes('/calendar'))
            ? 'pointer'
            : 'auto',
        }}
        onClick={() => {
          if (is_admin || window.location.pathname.includes('/calendar')) {
            setInputModal(true);
          }
        }}
      >
        {isToday ? (
          <div className="today">{day.getDate()}</div>
        ) : (
          day.getDate()
        )}
      </p>

      {renderProjectPhases()}
      {renderProjectList()}
      {renderMemos()}
    </div>
  );
};

// ========================
// 메인 CalendarDate 컴포넌트
// ========================

const CalendarDate: React.FC<LegacyCalendarDateProps> = ({
  index,
  week,
  month,
  year,
  type,
  day,
  current_project,
  project_list,
  user_memos,
  is_admin,
  refetch,
}) => {
  const DayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <>
      {/* 헤더 렌더링 */}
      {index === 0 && (
        <div className="th">
          {type !== '일' ? (
            DayNames.map((dayName, i) => (
              <div
                className={i === 0 || i === 6 ? 'holiday' : ''}
                key={i}
              >
                {dayName}
              </div>
            ))
          ) : (
            <div
              className={
                day && (day.getDay() === 0 || day.getDay() === 6)
                  ? 'holiday'
                  : ''
              }
            >
              {day && DayNames[day.getDay()]}
            </div>
          )}
        </div>
      )}

      {/* 월 뷰 */}
      {type === '월' && week && (
        <div className="td">
          <div className="week">
            {week.map((dayDate, i) => (
              <DateCell
                key={i}
                day={dayDate}
                month={month}
                year={year}
                current_project={current_project}
                project_list={project_list}
                user_memos={user_memos}
                is_admin={is_admin}
                refetch={refetch}
                index={0}
                type={type}
              />
            ))}
          </div>
        </div>
      )}

      {/* 주 뷰 */}
      {type === '주' && week && (
        <div className="td">
          <div className="week">
            {week.map((dayDate, i) => (
              <DateCell
                key={i}
                day={dayDate}
                month={month}
                year={year}
                current_project={current_project}
                project_list={project_list}
                user_memos={user_memos}
                is_admin={is_admin}
                refetch={refetch}
                index={0}
                type={type}
              />
            ))}
          </div>
        </div>
      )}

      {/* 일 뷰 */}
      {type === '일' && day && (
        <div className="td">
          <div className="week">
            <DateCell
              day={day}
              month={month}
              year={year}
              current_project={current_project}
              project_list={project_list}
              user_memos={user_memos}
              is_admin={is_admin}
              refetch={refetch}
              index={0}
              type={type}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default memo(CalendarDate);