import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    className = '',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    // Find the currently selected option to display its label
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div 
            className={`cs-wrapper ${className} ${disabled ? 'disabled' : ''}`}
            ref={containerRef}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                } else if (e.key === 'Escape') {
                    setIsOpen(false);
                }
            }}
        >
            <div className={`cs-trigger ${isOpen ? 'open' : ''} ${!value ? 'empty' : ''}`}>
                <span className="cs-label">{displayLabel}</span>
                <span className="cs-icon">
                    <ChevronDown size={14} />
                </span>
            </div>

            {isOpen && (
                <div className="cs-menu">
                    <ul className="cs-list" role="listbox">
                        <li 
                            className={`cs-option ${value === '' ? 'selected' : ''} is-placeholder`}
                            role="option"
                            aria-selected={value === ''}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect('');
                            }}
                        >
                            {placeholder}
                        </li>
                        {options.map((opt, i) => (
                            <li
                                key={i}
                                className={`cs-option ${value === opt.value ? 'selected' : ''}`}
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(opt.value);
                                }}
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
