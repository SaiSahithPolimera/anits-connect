import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [searchStr, setSearchStr] = useState('');
    const searchTimeout = useRef(null);
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const optionRefs = useRef([]);

    // All items: placeholder + options
    const allItems = [{ label: placeholder, value: '', isPlaceholder: true }, ...options];

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
            optionRefs.current[highlightedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [highlightedIndex, isOpen]);

    // When opening, set highlight to the currently selected item
    useEffect(() => {
        if (isOpen) {
            const idx = allItems.findIndex(item => item.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
        }
    }, [isOpen]);

    const handleSelect = useCallback((val) => {
        onChange(val);
        setIsOpen(false);
        setHighlightedIndex(-1);
    }, [onChange]);

    const handleKeyDown = useCallback((e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else if (highlightedIndex >= 0) {
                    handleSelect(allItems[highlightedIndex].value);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        prev < allItems.length - 1 ? prev + 1 : 0
                    );
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : allItems.length - 1
                    );
                }
                break;

            case 'Home':
                if (isOpen) {
                    e.preventDefault();
                    setHighlightedIndex(0);
                }
                break;

            case 'End':
                if (isOpen) {
                    e.preventDefault();
                    setHighlightedIndex(allItems.length - 1);
                }
                break;

            case 'Tab':
                if (isOpen) {
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                }
                break;

            default:
                // Type-to-search
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    const newSearch = searchStr + e.key.toLowerCase();
                    setSearchStr(newSearch);

                    clearTimeout(searchTimeout.current);
                    searchTimeout.current = setTimeout(() => setSearchStr(''), 600);

                    const matchIdx = allItems.findIndex(
                        (item, i) => i > 0 && item.label.toLowerCase().startsWith(newSearch)
                    );
                    if (matchIdx >= 0) {
                        if (!isOpen) setIsOpen(true);
                        setHighlightedIndex(matchIdx);
                    }
                }
                break;
        }
    }, [disabled, isOpen, highlightedIndex, allItems, handleSelect, searchStr]);

    // Find the currently selected option to display its label
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div
            className={`cs-wrapper ${className} ${disabled ? 'disabled' : ''}`}
            ref={containerRef}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
        >
            <div
                className={`cs-trigger ${isOpen ? 'open' : ''} ${!value ? 'empty' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="cs-label">{displayLabel}</span>
                <span className={`cs-icon ${isOpen ? 'rotated' : ''}`}>
                    <ChevronDown size={14} />
                </span>
            </div>

            {isOpen && (
                <div className="cs-menu">
                    <ul className="cs-list" ref={listRef} role="listbox">
                        {allItems.map((item, i) => {
                            const isSelected = value === item.value;
                            const isHighlighted = highlightedIndex === i;
                            return (
                                <li
                                    key={i}
                                    ref={el => optionRefs.current[i] = el}
                                    className={[
                                        'cs-option',
                                        isSelected ? 'selected' : '',
                                        isHighlighted ? 'highlighted' : '',
                                        item.isPlaceholder ? 'is-placeholder' : ''
                                    ].join(' ')}
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseEnter={() => setHighlightedIndex(i)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(item.value);
                                    }}
                                >
                                    <span className="cs-option-label">{item.label}</span>
                                    {isSelected && !item.isPlaceholder && (
                                        <span className="cs-check">
                                            <Check size={14} strokeWidth={2.5} />
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
