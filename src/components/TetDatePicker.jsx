import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BiCalendar, 
  BiChevronLeft, 
  BiChevronRight, 
  BiChevronsLeft, 
  BiChevronsRight
} from 'react-icons/bi';

const TetDatePicker = ({ value, onChange, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [value]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handlePrevYear = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
  };

  const handleDateClick = (day) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const isSelected = (day) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getDate() === day && d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push(
        <div
          key={d}
          className={`calendar-day ${isSelected(d) ? 'selected' : ''} ${isToday(d) ? 'today' : ''}`}
          onClick={() => handleDateClick(d)}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <div 
      className="tet-datepicker-container" 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        zIndex: isOpen ? 10000 : 1 
      }}
    >
      {label && <label className="tet-label small fw-bold text-muted mb-1 d-block">{label}</label>}
      <div className="position-relative datepicker-input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input
          type="text"
          className="tet-input w-100 pe-5 py-1"
          readOnly
          value={value ? new Date(value).toLocaleDateString('vi-VN') : ''}
          placeholder={placeholder || "Chọn ngày..."}
          style={{ fontSize: '0.85rem', cursor: 'pointer' }}
        />
        <BiCalendar className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{ cursor: 'pointer' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 2, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="tet-datepicker-dropdown"
          >
            <div className="datepicker-header">
              <div className="header-nav">
                <button type="button" className="nav-btn" onClick={handlePrevYear}><BiChevronsLeft size={16} /></button>
                <button type="button" className="nav-btn" onClick={handlePrevMonth}><BiChevronLeft size={18} /></button>
              </div>
              
              <div className="current-month">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>

              <div className="header-nav">
                <button type="button" className="nav-btn" onClick={handleNextMonth}><BiChevronRight size={18} /></button>
                <button type="button" className="nav-btn" onClick={handleNextYear}><BiChevronsRight size={16} /></button>
              </div>
            </div>

            <div className="datepicker-weekdays">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>

            <div className="datepicker-grid">
              {renderCalendar()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .tet-datepicker-container {
          position: relative;
        }
        .tet-datepicker-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 280px;
          background: #ffffff !important;
          border: 2px solid var(--tet-gold) !important;
          border-radius: 12px !important;
          padding: 15px !important;
          z-index: 99999;
          margin-top: 5px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
        }
        .datepicker-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 8px !important;
          padding-bottom: 6px !important;
          border-bottom: 1px solid rgba(215, 0, 24, 0.1) !important;
        }
        .header-nav {
          display: flex !important;
          gap: 2px !important;
        }
        .datepicker-header button.nav-btn {
          background: none !important;
          background-image: none !important;
          border: none !important;
          color: var(--tet-lucky-red) !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;
          padding: 0 !important;
          margin: 0 !important;
          border-radius: 4px !important;
          transition: all 0.2s !important;
          box-shadow: none !important;
          transform: none !important;
        }
        .datepicker-header button.nav-btn:hover {
          background: rgba(215, 0, 24, 0.05) !important;
        }
        .datepicker-header button.nav-btn svg {
          display: block !important;
        }
        .current-month {
          font-weight: 800 !important;
          color: var(--tet-lucky-red-dark) !important;
          font-size: 0.95rem !important;
          white-space: nowrap !important;
          text-align: center !important;
          flex-grow: 1 !important;
        }
        .datepicker-weekdays {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
          margin-bottom: 8px !important;
        }
        .weekday {
          text-align: center !important;
          font-size: 0.7rem !important;
          font-weight: 800 !important;
          color: #999 !important;
        }
        .datepicker-grid {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
          gap: 2px !important;
        }
        .calendar-day {
          aspect-ratio: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          border-radius: 6px !important;
          transition: all 0.2s !important;
          color: var(--tet-text-charcoal) !important;
          background: transparent !important;
          user-select: none !important;
        }
        .calendar-day:hover:not(.empty) {
          background: rgba(215, 0, 24, 0.05) !important;
          color: var(--tet-lucky-red) !important;
        }
        .calendar-day.selected {
          background: var(--tet-lucky-red) !important;
          color: #ffffff !important;
          box-shadow: 0 2px 5px rgba(215, 0, 24, 0.3) !important;
        }
        .calendar-day.today {
          color: var(--tet-lucky-red) !important;
          border: 1px solid rgba(215, 0, 24, 0.2) !important;
          font-weight: 800 !important;
        }
        .calendar-day.empty {
          cursor: default !important;
          background: transparent !important;
        }
      `}} />
    </div>
  );
};

export default TetDatePicker;
