/**
 * Tech IoT Warriors — Shared Utilities
 */

const Utils = {
  // Select single element
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  // Select all elements as Array
  $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  // Clamp number between min and max
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  // Linear interpolation
  lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  },

  // Map value from inRange to outRange
  mapRange(val, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return outMin;
    return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
  },

  // Format number with precision
  formatNumber(val, decimals = 1) {
    if (val === null || val === undefined || isNaN(val)) return '--';
    return Number(val).toFixed(decimals);
  },

  // Format current timestamp (HH:MM:SS)
  formatTime(date = new Date()) {
    return date.toTimeString().split(' ')[0];
  },

  // Format human-readable date & time
  formatDateTime(date = new Date()) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  },

  // Debounce function execution
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Throttle function execution
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // CSV Export utility
  exportToCSV(filename, headers, rows) {
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row
          .map(val => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Simple statistics calculator
  calcStats(dataArray) {
    if (!dataArray || dataArray.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    const nums = dataArray.filter(v => typeof v === 'number' && !isNaN(v));
    if (nums.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;

    return { min, max, avg, count: nums.length };
  }
};

if (typeof window !== 'undefined') {
  window.Utils = Utils;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
