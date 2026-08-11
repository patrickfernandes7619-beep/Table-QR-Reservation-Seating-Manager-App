/**
 * Utility to calculate the active business date based on restaurant operating hours and current time.
 */
export function calculateBusinessDate(operatingHours?: string, referenceTime: Date = new Date()): string {
  const now = referenceTime;
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (!operatingHours) {
    return todayStr;
  }

  // Extract opening and closing hours from string e.g. "Mon-Sun: 11:30 AM - 10:00 PM" or "5:00 PM - 2:00 AM"
  const timeMatches = operatingHours.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);

  let cutoffHour = 4; // Default cutoff: 4:00 AM (hours before 4 AM belong to previous business day)

  if (timeMatches) {
    const [, openHStr, , openAmpm, closeHStr, , closeAmpm] = timeMatches;

    if (closeHStr) {
      let closeH = parseInt(closeHStr, 10);
      if (closeAmpm) {
        const closeAmpmUpper = closeAmpm.toUpperCase();
        if (closeAmpmUpper === 'PM' && closeH < 12) closeH += 12;
        if (closeAmpmUpper === 'AM' && closeH === 12) closeH = 0;
      }

      // Check if closing time is early morning (e.g. 1 AM, 2 AM, 3 AM, 4 AM)
      const isLateNightClose = closeAmpm?.toUpperCase() === 'AM' || (closeH > 0 && closeH <= 6);
      if (isLateNightClose) {
        cutoffHour = Math.min(closeH + 1, 6);
      } else if (openHStr) {
        let openH = parseInt(openHStr, 10);
        if (openAmpm) {
          const openAmpmUpper = openAmpm.toUpperCase();
          if (openAmpmUpper === 'PM' && openH < 12) openH += 12;
          if (openAmpmUpper === 'AM' && openH === 12) openH = 0;
        }
        if (openH > 0 && openH <= 12) {
          cutoffHour = openH;
        }
      }
    }
  }

  const currentHour = now.getHours();

  // If current hour is before the cutoff hour for the current operating shift,
  // we are operating under yesterday's business shift
  if (currentHour < cutoffHour) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    return `${yYear}-${yMonth}-${yDay}`;
  }

  return todayStr;
}

export function formatBusinessDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export interface OperatingStatus {
  isOpen: boolean;
  currentBusinessDate: string;
  formattedDate: string;
  statusText: string;
  openTimeStr?: string;
  closeTimeStr?: string;
}

export function getRestaurantOperatingStatus(operatingHours?: string, referenceTime: Date = new Date()): OperatingStatus {
  const bizDate = calculateBusinessDate(operatingHours, referenceTime);
  const formattedDate = formatBusinessDate(bizDate);

  if (!operatingHours) {
    return {
      isOpen: true,
      currentBusinessDate: bizDate,
      formattedDate,
      statusText: 'Open • Active Shift'
    };
  }

  const timeMatches = operatingHours.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);

  if (!timeMatches) {
    return {
      isOpen: true,
      currentBusinessDate: bizDate,
      formattedDate,
      statusText: 'Open • Standard Hours'
    };
  }

  const [, openHStr, openMStr, openAmpm, closeHStr, closeMStr, closeAmpm] = timeMatches;

  let openHour = parseInt(openHStr, 10);
  let openMin = openMStr ? parseInt(openMStr, 10) : 0;
  if (openAmpm) {
    const ampm = openAmpm.toUpperCase();
    if (ampm === 'PM' && openHour < 12) openHour += 12;
    if (ampm === 'AM' && openHour === 12) openHour = 0;
  }

  let closeHour = parseInt(closeHStr, 10);
  let closeMin = closeMStr ? parseInt(closeMStr, 10) : 0;
  if (closeAmpm) {
    const ampm = closeAmpm.toUpperCase();
    if (ampm === 'PM' && closeHour < 12) closeHour += 12;
    if (ampm === 'AM' && closeHour === 12) closeHour = 0;
  }

  const nowMins = referenceTime.getHours() * 60 + referenceTime.getMinutes();
  const openMins = openHour * 60 + openMin;
  let closeMins = closeHour * 60 + closeMin;

  // Handle overnight shift e.g. 5:00 PM (1020) to 2:00 AM (120)
  let isOpen = false;
  if (closeMins < openMins) {
    // Overnight: open if time >= openMins OR time <= closeMins
    isOpen = nowMins >= openMins || nowMins <= closeMins;
  } else {
    // Same day shift: open if time is between openMins and closeMins
    isOpen = nowMins >= openMins && nowMins <= closeMins;
  }

  const openDisplay = `${openHStr}:${openMStr || '00'} ${openAmpm || ''}`.trim();
  const closeDisplay = `${closeHStr}:${closeMStr || '00'} ${closeAmpm || ''}`.trim();

  let statusText = isOpen 
    ? `Open Now • Closes ${closeDisplay}` 
    : `Closed • Opens ${openDisplay}`;

  return {
    isOpen,
    currentBusinessDate: bizDate,
    formattedDate,
    statusText,
    openTimeStr: openDisplay,
    closeTimeStr: closeDisplay
  };
}
