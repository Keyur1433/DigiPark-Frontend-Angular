import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  constructor() { }

  /**
   * Validate if the input time format is correct
   * @param time Time string to validate
   * @returns boolean indicating if time is valid
   */
  isValidInputTimeFormat(time: any): boolean {
    if (!time) return false;
    
    // If it's a string in HH:MM format
    if (typeof time === 'string') {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    }
    
    // If it's an object with hour and minute properties
    if (typeof time === 'object' && time !== null) {
      const hour = time.hour;
      const minute = time.minute;
      
      return (
        hour !== undefined && 
        minute !== undefined && 
        Number.isInteger(hour) && 
        Number.isInteger(minute) && 
        hour >= 0 && 
        hour <= 23 && 
        minute >= 0 && 
        minute <= 59
      );
    }
    
    return false;
  }

  /**
   * Parse date from various formats
   * @param date Date to parse
   * @returns Parsed date
   */
  parseDate(date: any): Date | null {
    if (!date) return null;
    
    // If already a Date object
    if (date instanceof Date) return date;
    
    // If it's a string
    if (typeof date === 'string') {
      // Try parsing as ISO string
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
      
      // Try DD-MM-YYYY format
      const parts = date.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
        const year = parseInt(parts[2], 10);
        
        const formattedDate = new Date(year, month, day);
        if (!isNaN(formattedDate.getTime())) return formattedDate;
      }
    }
    
    // If it's an object with day, month, year properties (NgbDate)
    if (typeof date === 'object' && date !== null) {
      const day = date.day;
      const month = date.month;
      const year = date.year;
      
      if (day && month && year) {
        return new Date(year, month - 1, day);
      }
    }
    
    return null;
  }

  /**
   * Format date to YYYY-MM-DD format
   * @param date Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | null): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
} 