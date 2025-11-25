import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Cruise, CasinoOffer, CalendarEvent, BookedCruise } from '@/types/models';

export interface ParsedOfferRow {
  shipName: string;
  sailingDate: string;
  itinerary: string;
  offerCode: string;
  offerName: string;
  roomType: string;
  guestsInfo: string;
  perks: string;
  shipClass: string;
  tradeInValue: number;
  offerExpiryDate: string;
  priceInterior: number;
  priceOceanView: number;
  priceBalcony: number;
  priceSuite: number;
  taxesFees: number;
  portsAndTimes: string;
  offerType: string;
  nights: number;
  departurePort: string;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

export function parseOffersCSV(content: string): { cruises: Cruise[]; offers: CasinoOffer[] } {
  console.log('[ImportExport] Starting to parse offers CSV');
  
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    console.log('[ImportExport] CSV has no data rows');
    return { cruises: [], offers: [] };
  }

  const headerLine = lines[0];
  const isTabDelimited = headerLine.includes('\t');
  
  console.log('[ImportExport] Detected delimiter:', isTabDelimited ? 'TAB' : 'COMMA');
  
  const headers = isTabDelimited 
    ? headerLine.split('\t').map(h => h.trim().toLowerCase())
    : parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  
  console.log('[ImportExport] Headers:', headers);

  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[h] = i;
  });

  const getColIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const idx = headerMap[name.toLowerCase()];
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const colIndices = {
    shipName: getColIndex(['ship name', 'shipname', 'ship']),
    sailingDate: getColIndex(['sailing date', 'sailingdate', 'sail date', 'saildate', 'date']),
    itinerary: getColIndex(['itinerary', 'route', 'destination']),
    offerCode: getColIndex(['offer code', 'offercode', 'code']),
    offerName: getColIndex(['offer name', 'offername', 'offer']),
    roomType: getColIndex(['room type', 'roomtype', 'cabin type', 'cabintype']),
    guestsInfo: getColIndex(['guests info', 'guestsinfo', 'guests']),
    perks: getColIndex(['perks', 'benefits']),
    shipClass: getColIndex(['ship class', 'shipclass', 'class']),
    tradeInValue: getColIndex(['trade-in value', 'tradeinvalue', 'trade in value', 'tradein']),
    offerExpiryDate: getColIndex(['offer expiry date', 'offerexpirydate', 'expiry date', 'expirydate', 'expiry', 'expires']),
    priceInterior: getColIndex(['price interior', 'priceinterior', 'interior price', 'interiorprice', 'interior']),
    priceOceanView: getColIndex(['price ocean view', 'priceoceanview', 'ocean view price', 'oceanviewprice', 'oceanview', 'price oceanview']),
    priceBalcony: getColIndex(['price balcony', 'pricebalcony', 'balcony price', 'balconyprice', 'balcony']),
    priceSuite: getColIndex(['price suite', 'pricesuite', 'suite price', 'suiteprice', 'suite']),
    taxesFees: getColIndex(['taxes & fees', 'taxes&fees', 'taxesfees', 'taxes', 'port taxes', 'port taxes & fees']),
    portsAndTimes: getColIndex(['ports & times', 'ports&times', 'portsandtimes', 'ports', 'port schedule']),
    offerType: getColIndex(['offer type / category', 'offertype', 'offer type', 'category', 'type']),
    nights: getColIndex(['nights', 'duration', 'length']),
    departurePort: getColIndex(['departure port', 'departureport', 'depart port', 'home port', 'port']),
  };

  console.log('[ImportExport] Column indices:', colIndices);

  const cruises: Cruise[] = [];
  const offerMap = new Map<string, CasinoOffer>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = isTabDelimited 
      ? line.split('\t').map(v => v.trim())
      : parseCSVLine(line);

    const getValue = (idx: number): string => {
      if (idx === -1 || idx >= values.length) return '';
      return values[idx] || '';
    };

    const getNumericValue = (idx: number): number => {
      const val = getValue(idx).replace(/[,$]/g, '');
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    const shipName = getValue(colIndices.shipName);
    const sailingDateRaw = getValue(colIndices.sailingDate);
    const itinerary = getValue(colIndices.itinerary);
    const offerCode = getValue(colIndices.offerCode);
    const offerName = getValue(colIndices.offerName);
    const roomType = getValue(colIndices.roomType);
    const guestsInfo = getValue(colIndices.guestsInfo);
    const perks = getValue(colIndices.perks);
    const shipClass = getValue(colIndices.shipClass);
    const tradeInValue = getNumericValue(colIndices.tradeInValue);
    const offerExpiryDateRaw = getValue(colIndices.offerExpiryDate);
    const priceInterior = getNumericValue(colIndices.priceInterior);
    const priceOceanView = getNumericValue(colIndices.priceOceanView);
    const priceBalcony = getNumericValue(colIndices.priceBalcony);
    const priceSuite = getNumericValue(colIndices.priceSuite);
    const taxesFees = getNumericValue(colIndices.taxesFees);
    const portsAndTimes = getValue(colIndices.portsAndTimes);
    const offerType = getValue(colIndices.offerType);
    const nights = getNumericValue(colIndices.nights) || 7;
    const departurePort = getValue(colIndices.departurePort);

    if (!shipName || !sailingDateRaw) {
      console.log(`[ImportExport] Skipping row ${i}: missing ship or date`);
      continue;
    }

    const sailDate = normalizeDateString(sailingDateRaw);
    const offerExpiryDate = normalizeDateString(offerExpiryDateRaw);
    
    const returnDate = calculateReturnDate(sailDate, nights);

    const ports = portsAndTimes
      ? portsAndTimes.split(/[→›‚Üí]/).map(p => p.trim()).filter(Boolean)
      : [];

    const cruiseId = `cruise_${shipName.replace(/\s+/g, '_')}_${sailDate}_${Date.now()}_${i}`;
    
    const cruise: Cruise = {
      id: cruiseId,
      shipName,
      sailDate,
      returnDate,
      departurePort,
      destination: itinerary,
      nights,
      cabinType: roomType || 'Balcony',
      interiorPrice: priceInterior,
      oceanviewPrice: priceOceanView,
      balconyPrice: priceBalcony,
      suitePrice: priceSuite,
      taxes: taxesFees,
      totalPrice: getPriceForRoomType(roomType, priceInterior, priceOceanView, priceBalcony, priceSuite),
      offerCode,
      offerExpiry: offerExpiryDate,
      itineraryName: itinerary,
      ports,
      guestsInfo,
      status: 'available',
      category: shipClass,
      createdAt: new Date().toISOString(),
    };

    cruises.push(cruise);
    console.log(`[ImportExport] Parsed cruise: ${shipName} - ${sailDate} - ${itinerary}`);

    if (offerCode && !offerMap.has(offerCode)) {
      const offer: CasinoOffer = {
        id: `offer_${offerCode}_${Date.now()}`,
        offerCode,
        offerName: offerName || offerCode,
        title: offerName || offerCode,
        offerType: mapOfferType(offerType),
        tradeInValue,
        expiryDate: offerExpiryDate,
        offerExpiryDate,
        expires: offerExpiryDate,
        category: offerType,
        perks: perks && perks !== '-' ? perks.split(',').map(p => p.trim()) : [],
        cruiseIds: [cruiseId],
        shipName,
        sailingDate: sailDate,
        roomType,
        guestsInfo,
        interiorPrice: priceInterior,
        oceanviewPrice: priceOceanView,
        balconyPrice: priceBalcony,
        suitePrice: priceSuite,
        taxesFees,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      offerMap.set(offerCode, offer);
    } else if (offerCode) {
      const existingOffer = offerMap.get(offerCode);
      if (existingOffer && existingOffer.cruiseIds) {
        existingOffer.cruiseIds.push(cruiseId);
      }
    }
  }

  const offersArray = Array.from(offerMap.values());
  console.log(`[ImportExport] Parsed ${cruises.length} cruises and ${offersArray.length} unique offers`);

  return { cruises, offers: offersArray };
}

function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  
  const cleaned = dateStr.trim();
  
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cleaned)) {
    const [month, day, year] = cleaned.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.split('T')[0];
  }
  
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
  
  return cleaned;
}

function calculateReturnDate(sailDate: string, nights: number): string {
  try {
    const date = new Date(sailDate);
    date.setDate(date.getDate() + nights);
    return date.toISOString().split('T')[0];
  } catch {
    return sailDate;
  }
}

function getPriceForRoomType(
  roomType: string,
  interior: number,
  oceanview: number,
  balcony: number,
  suite: number
): number {
  const type = roomType?.toLowerCase() || '';
  if (type.includes('interior')) return interior;
  if (type.includes('ocean') || type.includes('view')) return oceanview;
  if (type.includes('balcony')) return balcony;
  if (type.includes('suite')) return suite;
  return balcony || oceanview || interior || suite || 0;
}

function mapOfferType(typeStr: string): CasinoOffer['offerType'] {
  const lower = (typeStr || '').toLowerCase();
  if (lower.includes('freeplay') || lower.includes('free play')) return 'freeplay';
  if (lower.includes('discount')) return 'discount';
  if (lower.includes('obc')) return 'obc';
  if (lower.includes('2 guest') || lower.includes('2 person') || lower.includes('2person')) return '2person';
  if (lower.includes('1+') || lower.includes('1 +')) return '1+discount';
  return 'package';
}

export function parseICSFile(content: string): CalendarEvent[] {
  console.log('[ImportExport] Parsing ICS file');
  
  const events: CalendarEvent[] = [];
  const eventBlocks = content.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i];
    const endIdx = block.indexOf('END:VEVENT');
    const eventContent = endIdx > -1 ? block.substring(0, endIdx) : block;

    const getValue = (key: string): string => {
      const regex = new RegExp(`${key}[^:]*:(.*)`, 'i');
      const match = eventContent.match(regex);
      return match ? match[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',') : '';
    };

    const parseICSDate = (dateStr: string): string => {
      if (!dateStr) return '';
      const cleaned = dateStr.replace(/[^\dT]/g, '');
      if (cleaned.length >= 8) {
        const year = cleaned.slice(0, 4);
        const month = cleaned.slice(4, 6);
        const day = cleaned.slice(6, 8);
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const uid = getValue('UID') || `event_${Date.now()}_${i}`;
    const summary = getValue('SUMMARY');
    const dtstart = getValue('DTSTART');
    const dtend = getValue('DTEND');
    const location = getValue('LOCATION');
    const description = getValue('DESCRIPTION');

    if (!summary && !dtstart) continue;

    const startDate = parseICSDate(dtstart);
    const endDate = parseICSDate(dtend) || startDate;

    let eventType: CalendarEvent['type'] = 'other';
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('cruise') || lowerSummary.includes('sailing')) {
      eventType = 'cruise';
    } else if (lowerSummary.includes('flight') || lowerSummary.includes('air')) {
      eventType = 'flight';
    } else if (lowerSummary.includes('hotel') || lowerSummary.includes('stay')) {
      eventType = 'hotel';
    } else if (lowerSummary.includes('travel') || lowerSummary.includes('trip')) {
      eventType = 'travel';
    }

    const event: CalendarEvent = {
      id: uid,
      title: summary || 'Untitled Event',
      startDate,
      endDate,
      start: startDate,
      end: endDate,
      type: eventType,
      sourceType: 'import',
      location: location || undefined,
      description: description || undefined,
      source: 'import',
    };

    events.push(event);
    console.log(`[ImportExport] Parsed event: ${summary} - ${startDate}`);
  }

  console.log(`[ImportExport] Parsed ${events.length} calendar events`);
  return events;
}

export async function pickAndReadFile(fileType: 'csv' | 'ics'): Promise<{ content: string; fileName: string } | null> {
  try {
    console.log(`[ImportExport] Opening file picker for ${fileType}`);
    
    const mimeTypes = fileType === 'csv' 
      ? ['text/csv', 'text/plain', 'text/tab-separated-values', 'application/vnd.ms-excel']
      : ['text/calendar', 'text/plain'];

    const result = await DocumentPicker.getDocumentAsync({
      type: mimeTypes,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('[ImportExport] File picker cancelled');
      return null;
    }

    const asset = result.assets[0];
    console.log(`[ImportExport] File selected: ${asset.name}, URI: ${asset.uri}`);

    let content: string;
    
    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      content = await response.text();
    } else {
      const file = new File(asset.uri);
      content = await file.text();
    }

    console.log(`[ImportExport] File read successfully, length: ${content.length}`);
    return { content, fileName: asset.name };
  } catch (error) {
    console.error('[ImportExport] Error picking/reading file:', error);
    throw error;
  }
}

export function generateOffersCSV(cruises: Cruise[], offers: CasinoOffer[]): string {
  const headers = [
    'Ship Name',
    'Sailing Date',
    'Itinerary',
    'Offer Code',
    'Offer Name',
    'Room Type',
    'Guests Info',
    'Perks',
    'Ship Class',
    'Trade-In Value',
    'Offer Expiry Date',
    'Price Interior',
    'Price Ocean View',
    'Price Balcony',
    'Price Suite',
    'Taxes & Fees',
    'Ports & Times',
    'Offer Type / Category',
    'Nights',
    'Departure Port',
  ];

  const rows: string[] = [headers.join('\t')];

  for (const cruise of cruises) {
    const offer = offers.find(o => o.offerCode === cruise.offerCode);
    
    const row = [
      cruise.shipName || '',
      cruise.sailDate || '',
      cruise.itineraryName || cruise.destination || '',
      cruise.offerCode || '',
      offer?.offerName || offer?.title || '',
      cruise.cabinType || '',
      cruise.guestsInfo || '2 Guests',
      offer?.perks?.join(', ') || '-',
      cruise.category || '',
      (offer?.tradeInValue || 0).toString(),
      cruise.offerExpiry || '',
      (cruise.interiorPrice || 0).toString(),
      (cruise.oceanviewPrice || 0).toString(),
      (cruise.balconyPrice || 0).toString(),
      (cruise.suitePrice || 0).toString(),
      (cruise.taxes || 0).toString(),
      cruise.ports?.join(' → ') || '',
      offer?.category || '2 Guests',
      (cruise.nights || 7).toString(),
      cruise.departurePort || '',
    ];

    rows.push(row.join('\t'));
  }

  return rows.join('\n');
}

export function generateCalendarICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EasySeas//Cruise Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    const formatDate = (dateStr: string): string => {
      return dateStr.replace(/-/g, '');
    };

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}`);
    lines.push(`DTSTART:${formatDate(event.startDate || event.start || '')}`);
    lines.push(`DTEND:${formatDate(event.endDate || event.end || '')}`);
    lines.push(`SUMMARY:${(event.title || '').replace(/,/g, '\\,').replace(/\n/g, '\\n')}`);
    if (event.location) {
      lines.push(`LOCATION:${event.location.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`);
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export interface ParsedBookedRow {
  id: string;
  ship: string;
  departureDate: string;
  returnDate: string;
  nights: number;
  itineraryName: string;
  departurePort: string;
  portsRoute: string;
  reservationNumber: string;
  guests: number;
  bookingId: string;
  isBooked: boolean;
  winningsBroughtHome: number;
  cruisePointsEarned: number;
}

export function parseBookedCSV(content: string): BookedCruise[] {
  console.log('[ImportExport] Starting to parse booked CSV');
  
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    console.log('[ImportExport] Booked CSV has no data rows');
    return [];
  }

  const headerLine = lines[0];
  const isTabDelimited = headerLine.includes('\t');
  
  console.log('[ImportExport] Detected delimiter:', isTabDelimited ? 'TAB' : 'COMMA');
  
  const headers = isTabDelimited 
    ? headerLine.split('\t').map(h => h.trim().toLowerCase())
    : parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  
  console.log('[ImportExport] Booked CSV Headers:', headers);

  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[h] = i;
  });

  const getColIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const idx = headerMap[name.toLowerCase()];
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const colIndices = {
    id: getColIndex(['id', 'cruiseid', 'cruise_id']),
    ship: getColIndex(['ship', 'shipname', 'ship name', 'ship_name']),
    departureDate: getColIndex(['departuredate', 'departure date', 'departure_date', 'saildate', 'sail date']),
    returnDate: getColIndex(['returndate', 'return date', 'return_date', 'enddate', 'end date']),
    nights: getColIndex(['nights', 'duration', 'length', 'night']),
    itineraryName: getColIndex(['itineraryname', 'itinerary name', 'itinerary_name', 'itinerary']),
    departurePort: getColIndex(['departureport', 'departure port', 'departure_port', 'homeport', 'home port']),
    portsRoute: getColIndex(['portsroute', 'ports route', 'ports_route', 'ports', 'route']),
    reservationNumber: getColIndex(['reservationnumber', 'reservation number', 'reservation_number', 'reservation', 'confirmation']),
    guests: getColIndex(['guests', 'guest count', 'guestcount', 'pax']),
    bookingId: getColIndex(['bookingid', 'booking id', 'booking_id', 'booking']),
    isBooked: getColIndex(['isbooked', 'is booked', 'is_booked', 'booked', 'status']),
    winningsBroughtHome: getColIndex(['winningsbroughthome', 'winnings brought home', 'winnings_brought_home', 'winnings', 'casino winnings']),
    cruisePointsEarned: getColIndex(['cruisepointsearned', 'cruise points earned', 'cruise_points_earned', 'points earned', 'points']),
  };

  console.log('[ImportExport] Booked column indices:', colIndices);

  const bookedCruises: BookedCruise[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = isTabDelimited 
      ? line.split('\t').map(v => v.trim())
      : parseCSVLine(line);

    const getValue = (idx: number): string => {
      if (idx === -1 || idx >= values.length) return '';
      return values[idx] || '';
    };

    const getNumericValue = (idx: number): number => {
      const val = getValue(idx).replace(/[,$]/g, '');
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    const getBooleanValue = (idx: number): boolean => {
      const val = getValue(idx).toLowerCase();
      return val === 'true' || val === 'yes' || val === '1';
    };

    const id = getValue(colIndices.id) || `booked_${Date.now()}_${i}`;
    const ship = getValue(colIndices.ship);
    const departureDateRaw = getValue(colIndices.departureDate);
    const returnDateRaw = getValue(colIndices.returnDate);
    const nights = getNumericValue(colIndices.nights) || 7;
    const itineraryName = getValue(colIndices.itineraryName);
    const departurePort = getValue(colIndices.departurePort);
    const portsRoute = getValue(colIndices.portsRoute);
    const reservationNumber = getValue(colIndices.reservationNumber);
    const guests = getNumericValue(colIndices.guests) || 2;
    const bookingId = getValue(colIndices.bookingId) || reservationNumber;
    const isBooked = getBooleanValue(colIndices.isBooked);
    const winningsBroughtHome = getNumericValue(colIndices.winningsBroughtHome);
    const cruisePointsEarned = getNumericValue(colIndices.cruisePointsEarned);

    if (!ship || !departureDateRaw) {
      console.log(`[ImportExport] Skipping booked row ${i}: missing ship or date`);
      continue;
    }

    const sailDate = normalizeDateString(departureDateRaw);
    const returnDate = returnDateRaw ? normalizeDateString(returnDateRaw) : calculateReturnDate(sailDate, nights);

    const ports = portsRoute
      ? portsRoute.split(/[→›|,]/).map(p => p.trim()).filter(Boolean)
      : [];

    const completionState = isBooked 
      ? (new Date(sailDate) < new Date() ? 'completed' : 'upcoming')
      : 'upcoming';

    const bookedCruise: BookedCruise = {
      id,
      shipName: ship,
      sailDate,
      returnDate,
      departurePort,
      destination: itineraryName,
      nights,
      itineraryName,
      ports,
      guests,
      reservationNumber,
      bookingId,
      status: isBooked ? 'booked' : 'available',
      completionState,
      winnings: winningsBroughtHome || undefined,
      earnedPoints: cruisePointsEarned || undefined,
      createdAt: new Date().toISOString(),
    };

    bookedCruises.push(bookedCruise);
    console.log(`[ImportExport] Parsed booked cruise: ${ship} - ${sailDate} - ${itineraryName}`);
  }

  console.log(`[ImportExport] Parsed ${bookedCruises.length} booked cruises`);
  return bookedCruises;
}

export function generateBookedCSV(bookedCruises: BookedCruise[]): string {
  const headers = [
    'id',
    'ship',
    'departureDate',
    'returnDate',
    'nights',
    'itineraryName',
    'departurePort',
    'portsRoute',
    'reservationNumber',
    'guests',
    'bookingId',
    'isBooked',
    'winningsBroughtHome',
    'cruisePointsEarned',
  ];

  const rows: string[] = [headers.join('\t')];

  for (const cruise of bookedCruises) {
    const isBooked = cruise.status === 'booked' || cruise.completionState === 'completed' || cruise.completionState === 'upcoming';
    
    const row = [
      cruise.id || '',
      cruise.shipName || '',
      cruise.sailDate || '',
      cruise.returnDate || '',
      (cruise.nights || 0).toString(),
      cruise.itineraryName || cruise.destination || '',
      cruise.departurePort || '',
      cruise.ports?.join(' | ') || '',
      cruise.reservationNumber || '',
      (cruise.guests || 2).toString(),
      cruise.bookingId || cruise.reservationNumber || '',
      isBooked ? 'TRUE' : 'FALSE',
      (cruise.winnings || '').toString(),
      (cruise.earnedPoints || '').toString(),
    ];

    rows.push(row.join('\t'));
  }

  return rows.join('\n');
}

export async function exportFile(content: string, fileName: string): Promise<boolean> {
  try {
    console.log(`[ImportExport] Exporting file: ${fileName}`);

    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[ImportExport] Web download initiated');
      return true;
    }

    const file = new File(Paths.cache, fileName);
    file.write(content);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: fileName.endsWith('.ics') ? 'text/calendar' : 'text/csv',
        dialogTitle: `Export ${fileName}`,
      });
      console.log('[ImportExport] File shared successfully');
      return true;
    } else {
      console.log('[ImportExport] Sharing not available');
      return false;
    }
  } catch (error) {
    console.error('[ImportExport] Export error:', error);
    throw error;
  }
}
