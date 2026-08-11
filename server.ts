import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initialTables, initialWaitlist, initialRestaurantInfo, initialTurnoverRecords } from "./src/initialData.js";
import { Table, WaitlistEntry, RestaurantInfo, SeatingStats, GuestTurnoverRecord } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Persistent File Data Store Setup
  const DATA_FILE = path.join(process.cwd(), "data", "store.json");

  // Server-Sent Events (SSE) Client Connections for Instant Real-Time Sync
  let sseClients: express.Response[] = [];

  function notifyClients() {
    sseClients.forEach((client) => {
      try {
        client.write("data: update\n\n");
      } catch (e) {
        // client socket closed
      }
    });
  }

  let tables: Table[] = [];
  let waitlist: WaitlistEntry[] = [];
  let restaurantInfo: RestaurantInfo = { ...initialRestaurantInfo };
  let turnoverRecords: GuestTurnoverRecord[] = [];
  let zones: string[] = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'];
  let todaySeatedCount = 18;

  function loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tables) && parsed.tables.length > 0) {
          tables = parsed.tables.map((t: Table) => ({
            x: 50,
            y: 50,
            shape: 'square',
            notes: '',
            ...t
          }));
        } else {
          tables = [...initialTables];
        }

        if (Array.isArray(parsed.waitlist)) {
          waitlist = parsed.waitlist;
        } else {
          waitlist = [...initialWaitlist];
        }

        if (parsed.restaurantInfo && typeof parsed.restaurantInfo === 'object') {
          // Merge with initial defaults so new feature properties are preserved
          restaurantInfo = { ...initialRestaurantInfo, ...parsed.restaurantInfo };
        } else {
          restaurantInfo = { ...initialRestaurantInfo };
        }

        if (Array.isArray(parsed.turnoverRecords)) {
          turnoverRecords = parsed.turnoverRecords;
        } else {
          turnoverRecords = [...initialTurnoverRecords];
        }

        if (Array.isArray(parsed.zones) && parsed.zones.length > 0) {
          const defaultZones = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'];
          zones = Array.from(new Set([...defaultZones, ...parsed.zones]));
        } else {
          zones = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'];
        }

        if (typeof parsed.todaySeatedCount === "number") {
          todaySeatedCount = parsed.todaySeatedCount;
        }

        return;
      }
    } catch (err) {
      console.warn("[Store] Error loading store.json, initializing defaults:", err);
    }

    tables = [...initialTables];
    waitlist = [...initialWaitlist];
    restaurantInfo = { ...initialRestaurantInfo };
    turnoverRecords = [...initialTurnoverRecords];
    zones = ['Main Dining', 'Patio Outdoor', 'Private Booths', 'Bar Lounge', 'VIP Room'];
    todaySeatedCount = 18;
    saveData();
  }

  function saveData() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const dataToSave = {
        tables,
        waitlist,
        restaurantInfo,
        turnoverRecords,
        zones,
        todaySeatedCount
      };
      // Write atomically to temporary file then rename to prevent file corruption
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tmpFile, DATA_FILE);

      // Broadcast update to all real-time clients
      notifyClients();
    } catch (err) {
      console.error("[Store] Failed to save store.json:", err);
    }
  }

  loadData();

  // SSE Stream Endpoint for Real-Time Live Updates across Devices/Tabs
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseClients.push(res);

    // Send initial handshake
    res.write("data: connected\n\n");

    req.on("close", () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
  });

  // Initialize Gemini AI client safely if API key exists
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn("Failed to initialize Gemini AI client:", e);
    }
  }

  // --- API ENDPOINTS ---

  // 1. Get Restaurant Config & Metadata
  app.get("/api/restaurant", (req, res) => {
    res.json(restaurantInfo);
  });

  // Update Restaurant Config
  app.put("/api/restaurant", (req, res) => {
    restaurantInfo = { ...restaurantInfo, ...req.body };
    saveData();
    res.json({ success: true, restaurantInfo });
  });

  // 2. Get All Tables
  app.get("/api/tables", (req, res) => {
    res.json(tables);
  });

  // Update Table Status / Details
  app.patch("/api/tables/:id", (req, res) => {
    const { id } = req.params;
    const index = tables.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Table not found" });
    }

    const previousStatus = tables[index].status;
    const updatedTable = { ...tables[index], ...req.body };

    if (req.body.number && String(req.body.number).trim()) {
      updatedTable.number = String(req.body.number).trim();
    }
    if (req.body.name && String(req.body.name).trim()) {
      updatedTable.name = String(req.body.name).trim();
    }
    if (req.body.capacity) {
      updatedTable.capacity = Number(req.body.capacity) || updatedTable.capacity;
    }

    // If changing to occupied, update seated time & count and log turnover
    if (previousStatus !== "occupied" && updatedTable.status === "occupied") {
      updatedTable.seatedAt = updatedTable.seatedAt || new Date().toISOString();
      todaySeatedCount++;

      // Log turnover entry
      const activeBizDate = restaurantInfo.currentBusinessDate || "2026-08-10";
      const newTr: GuestTurnoverRecord = {
        id: `tr_${Date.now()}`,
        guestName: updatedTable.currentGuestName || "Walk-In Guest",
        phone: "(555) 000-1234",
        email: "guest@bistrolumiere.com",
        partySize: updatedTable.currentPartySize || updatedTable.capacity,
        tableId: updatedTable.id,
        tableNumber: updatedTable.number,
        zone: updatedTable.zone,
        date: activeBizDate,
        seatedAt: updatedTable.seatedAt,
        type: "direct_seated",
        status: "seated"
      };
      turnoverRecords.unshift(newTr);
    } else if (updatedTable.status === "available" || updatedTable.status === "cleaning") {
      // Complete active turnover for this table if any
      const openRecord = turnoverRecords.find(tr => tr.tableId === updatedTable.id && tr.status === "seated");
      if (openRecord) {
        openRecord.status = "completed";
        openRecord.completedAt = new Date().toISOString();
        const seatedTime = new Date(openRecord.seatedAt).getTime();
        const compTime = new Date(openRecord.completedAt).getTime();
        openRecord.durationMinutes = Math.max(15, Math.round((compTime - seatedTime) / 60000));
      }

      updatedTable.currentGuestName = undefined;
      updatedTable.guestPhone = undefined;
      updatedTable.guestEmail = undefined;
      updatedTable.reservationTime = undefined;
      updatedTable.currentPartySize = undefined;
      updatedTable.seatedAt = undefined;
    }

    // Sync table zone to zones array if custom
    if (req.body.zone && typeof req.body.zone === 'string' && req.body.zone.trim()) {
      const zTrim = req.body.zone.trim();
      if (!zones.includes(zTrim)) {
        zones.push(zTrim);
      }
    }

    tables[index] = updatedTable;
    saveData();
    res.json(updatedTable);
  });

  // Add New Table
  app.post("/api/tables", (req, res) => {
    const tableZone = (req.body.zone && typeof req.body.zone === 'string' && req.body.zone.trim()) 
      ? req.body.zone.trim() 
      : "Main Dining";

    const tableNumber = (req.body.number && String(req.body.number).trim())
      ? String(req.body.number).trim()
      : `T-${tables.length + 1}`;

    const tableName = (req.body.name && String(req.body.name).trim())
      ? String(req.body.name).trim()
      : `Table ${tableNumber}`;

    const newTable: Table = {
      id: `t_${Date.now()}`,
      number: tableNumber,
      name: tableName,
      zone: tableZone,
      capacity: Number(req.body.capacity) || 4,
      status: "available",
      x: req.body.x ?? 50,
      y: req.body.y ?? 50,
      shape: req.body.shape || "square",
      notes: req.body.notes ? String(req.body.notes).trim() : ""
    };
    tables.push(newTable);
    if (!zones.includes(tableZone)) {
      zones.push(tableZone);
    }
    saveData();
    res.status(201).json(newTable);
  });

  // Delete Table
  app.delete("/api/tables/:id", (req, res) => {
    const { id } = req.params;
    tables = tables.filter((t) => t.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // 2b. Zone / Section Management Endpoints
  app.get("/api/zones", (req, res) => {
    // Collect all unique zones from existing tables as well to prevent dropping custom sections
    let changed = false;
    tables.forEach(t => {
      if (t.zone && t.zone.trim() && !zones.includes(t.zone.trim())) {
        zones.push(t.zone.trim());
        changed = true;
      }
    });
    if (changed) saveData();
    res.json(zones);
  });

  app.post("/api/zones", (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: "Zone name is required" });
    }
    const trimmed = name.trim();
    if (!zones.includes(trimmed)) {
      zones.push(trimmed);
      saveData();
    }
    res.status(201).json(zones);
  });

  app.put("/api/zones/:name", (req, res) => {
    const oldZoneName = decodeURIComponent(req.params.name);
    const { newName } = req.body;
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return res.status(400).json({ error: "New section name is required" });
    }
    const trimmedNew = newName.trim();
    
    // Replace in zones array
    zones = zones.map((z) => (z === oldZoneName ? trimmedNew : z));
    
    // Update all tables in old zone to new zone
    tables = tables.map((t) => (t.zone === oldZoneName ? { ...t, zone: trimmedNew } : t));
    saveData();

    res.json({ success: true, zones, renamedFrom: oldZoneName, renamedTo: trimmedNew });
  });

  app.delete("/api/zones/:name", (req, res) => {
    const zoneName = decodeURIComponent(req.params.name);
    zones = zones.filter((z) => z !== zoneName);
    
    // Re-assign any tables in deleted zone to first available zone or 'Main Dining'
    const fallbackZone = zones[0] || 'Main Dining';
    tables = tables.map((t) => (t.zone === zoneName ? { ...t, zone: fallbackZone } : t));
    saveData();

    res.json({ success: true, zones, reassignedTablesTo: fallbackZone });
  });

  // 3. Get Waitlist Entries
  app.get("/api/waitlist", (req, res) => {
    res.json(waitlist);
  });

  // New Walk-In Customer Check-In / Reservation (Mobile QR or Manual Desk Entry)
  app.post("/api/walkin", (req, res) => {
    const { customerName, phone, email, partySize, preferredZone, specialRequests, type, preferredTime } = req.body;

    if (!customerName || !phone || !partySize) {
      return res.status(400).json({ error: "Name, phone, and party size are required" });
    }

    // Auto calculate estimated wait minutes based on active queue and occupied tables
    const waitingBefore = waitlist.filter((w) => w.status === "waiting" || w.status === "notified").length;
    const estimatedWaitMinutes = waitingBefore === 0 ? 5 : Math.max(10, waitingBefore * 12);

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newEntry: WaitlistEntry = {
      id: `w_${Date.now()}`,
      customerName,
      phone,
      email,
      partySize: Number(partySize),
      type: type || "walkin_immediate",
      preferredTime,
      preferredZone: preferredZone || "Any",
      status: "waiting",
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes,
      specialRequests: specialRequests || "",
      confirmationCode: `BL-${randomNum}`
    };

    // Check if any matching table is IMMEDIATELY available
    const availableMatch = tables.find(
      (t) =>
        t.status === "available" &&
        t.capacity >= newEntry.partySize &&
        (newEntry.preferredZone === "Any" || t.zone === newEntry.preferredZone)
    );

    if (availableMatch && newEntry.type === "walkin_immediate") {
      // Auto-seat or offer instant table!
      newEntry.status = "notified";
      newEntry.assignedTableId = availableMatch.id;
      newEntry.assignedTableNumber = availableMatch.number;
      newEntry.estimatedWaitMinutes = 0;
    }

    waitlist.unshift(newEntry);
    saveData();
    res.status(201).json(newEntry);
  });

  // Update Waitlist Status (Notify, Seat, Cancel, Complete)
  app.patch("/api/waitlist/:id", (req, res) => {
    const { id } = req.params;
    const index = waitlist.findIndex((w) => w.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Waitlist entry not found" });
    }

    const updated = { ...waitlist[index], ...req.body };

    // If seating customer, update assigned table state as occupied and log turnover
    if (updated.status === "seated" && updated.assignedTableId) {
      const tIndex = tables.findIndex((t) => t.id === updated.assignedTableId);
      if (tIndex !== -1) {
        tables[tIndex].status = "occupied";
        tables[tIndex].currentGuestName = updated.customerName;
        tables[tIndex].currentPartySize = updated.partySize;
        tables[tIndex].seatedAt = new Date().toISOString();
        todaySeatedCount++;

        const activeBizDate = restaurantInfo.currentBusinessDate || "2026-08-10";
        const newTr: GuestTurnoverRecord = {
          id: `tr_${Date.now()}`,
          guestName: updated.customerName,
          phone: updated.phone || "(555) 000-0000",
          email: updated.email || `${updated.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          partySize: updated.partySize,
          tableId: tables[tIndex].id,
          tableNumber: tables[tIndex].number,
          zone: tables[tIndex].zone,
          date: activeBizDate,
          seatedAt: tables[tIndex].seatedAt!,
          type: updated.type || "walkin_immediate",
          status: "seated",
          specialRequests: updated.specialRequests
        };
        turnoverRecords.unshift(newTr);
      }
    }

    waitlist[index] = updated;
    saveData();
    res.json(updated);
  });

  // 4. Turnover & Guest Logs Endpoints
  app.get("/api/turnover", (req, res) => {
    const { date, month } = req.query;
    let filtered = [...turnoverRecords];

    if (date && typeof date === 'string') {
      filtered = filtered.filter(t => t.date === date);
    } else if (month && typeof month === 'string') {
      filtered = filtered.filter(t => t.date.startsWith(month));
    }

    res.json(filtered);
  });

  app.post("/api/turnover", (req, res) => {
    const newRecord: GuestTurnoverRecord = {
      id: `tr_${Date.now()}`,
      guestName: req.body.guestName || "Guest",
      phone: req.body.phone || "(555) 000-0000",
      email: req.body.email || "guest@example.com",
      partySize: Number(req.body.partySize) || 2,
      tableId: req.body.tableId || "t1",
      tableNumber: req.body.tableNumber || "M-01",
      zone: req.body.zone || "Main Dining",
      date: req.body.date || restaurantInfo.currentBusinessDate || "2026-08-10",
      seatedAt: req.body.seatedAt || new Date().toISOString(),
      completedAt: req.body.completedAt,
      durationMinutes: req.body.durationMinutes,
      type: req.body.type || "walkin_immediate",
      status: req.body.status || "seated",
      specialRequests: req.body.specialRequests || ""
    };

    turnoverRecords.unshift(newRecord);
    saveData();
    res.status(201).json(newRecord);
  });

  // 5. Seating & Turnover Statistics
  app.get("/api/stats", (req, res) => {
    const totalTables = tables.length;
    const availableTables = tables.filter((t) => t.status === "available").length;
    const occupiedTables = tables.filter((t) => t.status === "occupied").length;
    const reservedTables = tables.filter((t) => t.status === "reserved").length;
    const cleaningTables = tables.filter((t) => t.status === "cleaning").length;
    const activeWaitlistCount = waitlist.filter((w) => w.status === "waiting" || w.status === "notified").length;

    const currentBizDate = restaurantInfo.currentBusinessDate || "2026-08-10";
    const currentMonth = currentBizDate.substring(0, 7); // e.g. "2026-08"

    const todayRecords = turnoverRecords.filter(tr => tr.date === currentBizDate);
    const monthRecords = turnoverRecords.filter(tr => tr.date.startsWith(currentMonth));

    const todayTableTurnovers = todayRecords.length;
    const todayTotalGuests = todayRecords.reduce((sum, tr) => sum + tr.partySize, 0);

    const monthlyTableTurnovers = monthRecords.length;
    const monthlyTotalGuests = monthRecords.reduce((sum, tr) => sum + tr.partySize, 0);

    const completedToday = todayRecords.filter(tr => tr.durationMinutes && tr.durationMinutes > 0);
    const averageTurnTimeMinutes = completedToday.length > 0
      ? Math.round(completedToday.reduce((sum, tr) => sum + (tr.durationMinutes || 0), 0) / completedToday.length)
      : 55;

    const stats: SeatingStats = {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      cleaningTables,
      activeWaitlistCount,
      todaySeatedCount: todayTableTurnovers > 0 ? todayTableTurnovers : todaySeatedCount,
      todayTableTurnovers,
      todayTotalGuests,
      monthlyTableTurnovers,
      monthlyTotalGuests,
      averageWaitTimeMinutes: activeWaitlistCount > 0 ? 12 : 0,
      averageTurnTimeMinutes,
      occupancyPercentage: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
      currentBusinessDate: currentBizDate
    };

    res.json(stats);
  });

  // 5. Gemini AI Intelligent Table Matcher & Recommendation Endpoint
  app.post("/api/ai/suggest-seating", async (req, res) => {
    const { partySize, preferredZone, specialRequests, guestName } = req.body;

    const availableTables = tables.filter((t) => t.status === "available");
    const cleaningTables = tables.filter((t) => t.status === "cleaning");
    const occupiedTables = tables.filter((t) => t.status === "occupied");

    if (!ai) {
      // Fallback heuristic if no Gemini key present
      const bestMatch = availableTables
        .filter((t) => t.capacity >= partySize)
        .sort((a, b) => a.capacity - b.capacity)[0];

      return res.json({
        recommendedTable: bestMatch || null,
        reasoning: bestMatch
          ? `Selected ${bestMatch.name} (${bestMatch.number}) in ${bestMatch.zone} as it cleanly fits ${partySize} guests (capacity ${bestMatch.capacity}).`
          : "No immediate available table found for this party size. Guest added to waitlist.",
        suggestedWaitMinutes: bestMatch ? 0 : 15,
        aiPowered: false
      });
    }

    try {
      const prompt = `You are an expert restaurant maître d' and seating algorithm.
Restaurant: ${restaurantInfo.name}
Guest Request:
- Name: ${guestName || "Walk-In Guest"}
- Party Size: ${partySize}
- Preferred Zone: ${preferredZone || "Any"}
- Special Notes/Requests: ${specialRequests || "None"}

Current Real-Time Table Statuses:
${JSON.stringify(
  tables.map((t) => ({
    id: t.id,
    number: t.number,
    name: t.name,
    zone: t.zone,
    capacity: t.capacity,
    status: t.status,
    seatedAt: t.seatedAt
  })),
  null,
  2
)}

Determine:
1. The single best table ID to assign (must prioritize available tables that fit partySize without wasting large 10-person tables on 2 people, matching zone preferences, and considering special requests like high chairs or quiet areas).
2. If no table is available right now, identify which occupied table will likely turn over soonest, or suggest combining tables.
3. Provide a polite, concise 2-sentence explanation for the host desk staff.

Respond in strict JSON format:
{
  "recommendedTableId": "table_id_here or null",
  "reasoning": "Explanation here",
  "estimatedWaitMinutes": number_here
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);

      const recommendedTable = tables.find((t) => t.id === parsed.recommendedTableId) || null;

      res.json({
        recommendedTable,
        reasoning: parsed.reasoning || "AI seating optimization complete.",
        estimatedWaitMinutes: parsed.estimatedWaitMinutes ?? (recommendedTable ? 0 : 15),
        aiPowered: true
      });
    } catch (err: any) {
      console.error("Gemini AI seating error:", err);
      // Heuristic fallback on AI error
      const bestMatch = availableTables
        .filter((t) => t.capacity >= partySize)
        .sort((a, b) => a.capacity - b.capacity)[0];

      res.json({
        recommendedTable: bestMatch || null,
        reasoning: bestMatch
          ? `Assigned ${bestMatch.name} (${bestMatch.number}) in ${bestMatch.zone}.`
          : "No table currently available for immediate seating.",
        suggestedWaitMinutes: bestMatch ? 0 : 15,
        aiPowered: false
      });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Table Reservation & Seating Manager Server running on http://localhost:${PORT}`);
  });
}

startServer();
