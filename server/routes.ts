import { type Express } from "express";
import { db } from "db";
import { epics, tasks } from "@db/schema";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";

export function registerRoutes(app: Express) {
  // Epics
  app.get("/api/epics", async (req, res) => {
    try {
      const allEpics = await db.query.epics.findMany();
      res.json(allEpics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch epics" });
    }
  });

  app.put("/api/epics/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(epics)
        .set(req.body)
        .where(eq(epics.id, parseInt(id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update epic" });
    }
  });

  // CSV Upload
  app.post("/api/upload/csv", async (req, res) => {
    try {
      const { data: csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ error: "CSV data is required" });
      }

      // Start a transaction to ensure data consistency
      await db.transaction(async (tx) => {
        console.log('Starting transaction - clearing existing tasks');
        // Delete all existing tasks and epics
        await tx.delete(tasks);
        await tx.delete(epics);
        
        const epicName = `Imported Tasks ${new Date().toLocaleDateString()}`;
        console.log('Processing CSV upload with generated epic name:', epicName);
        console.log('CSV data preview:', csvData.substring(0, 200));

      interface CSVRecord {
        Summary?: string;
        Status?: string;
        Created?: string;
        'Due date'?: string;
        dependencies?: string;
      }

      let records: CSVRecord[];
      try {
        records = parse(csvData, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relaxColumnCount: true,
          bom: true
        }) as CSVRecord[];
      } catch (parseError) {
        console.error('CSV parse error:', parseError);
        return res.status(400).json({ 
          error: "Failed to parse CSV file",
          details: parseError instanceof Error ? parseError.message : "Invalid CSV format"
        });
      }

      console.log('Successfully parsed records:', records);

      if (!records || records.length === 0) {
        return res.status(400).json({ error: "No valid records found in CSV" });
      }

      

      // Find the earliest and latest dates from tasks
      let minDate = new Date();
      let maxDate = new Date();
      records.forEach((record: CSVRecord) => {
        const startDate = new Date(record.Created || Date.now());
        const endDate = new Date(record['Due date'] || Date.now());
        if (!isNaN(startDate.getTime()) && startDate < minDate) minDate = startDate;
        if (!isNaN(endDate.getTime()) && endDate > maxDate) maxDate = endDate;
      });
      
      // Create epic with date range from tasks
      const epic = {
        name: epicName,
        description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
        startDate: minDate,
        endDate: maxDate,
        status: "In Progress"
      };

      const [result] = await db.insert(epics).values(epic).returning();
      
      // Process each CSV record into tasks
      const processedTasks = [];
      for (const record of records) {
        const taskName = record.Summary;
        if (!taskName) {
          console.warn('Skipping record without Summary:', record);
          continue;
        }

        // Parse dates with validation
        let startDate = new Date();
        try {
          startDate = new Date(record.Created || Date.now());
          if (isNaN(startDate.getTime())) throw new Error('Invalid start date');
        } catch (error) {
          console.warn(`Invalid start date for task "${taskName}", using current date`);
        }

        let endDate = new Date();
        try {
          endDate = new Date(record['Due date'] || Date.now());
          if (isNaN(endDate.getTime())) throw new Error('Invalid end date');
        } catch (error) {
          console.warn(`Invalid end date for task "${taskName}", using current date`);
        }

        // Ensure end date is not before start date
        if (endDate < startDate) {
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Add one day
        }

        const task = {
          epicId: result.id,
          name: taskName,
          description: "",
          startDate,
          endDate,
          status: record.Status || "To Do",
          dependencies: record.dependencies ? record.dependencies.split(",").map(d => d.trim()) : []
        };
        
        try {
          const [insertedTask] = await db.insert(tasks).values(task).returning();
          processedTasks.push(insertedTask);
          console.log(`Successfully created task: ${taskName}`);
        } catch (error) {
          console.error(`Failed to create task "${taskName}":`, error);
        }
      }

      res.json({ success: true, epicId: result.id });
      }); // End of transaction
    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(500).json({ 
        error: "Failed to process CSV file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const allTasks = await db.query.tasks.findMany();
      res.json(allTasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(tasks)
        .set(req.body)
        .where(eq(tasks.id, parseInt(id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // End of routes
}
