import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * HUJI Shnaton Scraper - API Crawler Mode
 * Crawls the new Shnaton API directly based on discovered patterns.
 */

const ACADEMIC_YEAR = '2025';
const FACULTY_ID = '7'; // Social Sciences (from captured-api-raw.json)
const BASE_API = 'https://shnaton.huji.ac.il/api';
const OUTPUT_FILE = path.join(process.cwd(), 'huji-catalog-full.json');

async function scrape() {
  console.log('🚀 Starting API Crawler Scraper...');
  
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    // 1. Get Departments
    console.log(`📂 Fetching departments for Faculty ${FACULTY_ID}...`);
    await page.goto(`${BASE_API}/faculties/007/departments?year=${ACADEMIC_YEAR}`, { waitUntil: 'networkidle2' });
    const departments = await page.evaluate(() => JSON.parse(document.body.innerText));
    
    console.log(`✅ Found ${departments.length} departments.`);
    
    const allCourses = [];

    // 2. Iterate through departments to get courses
    for (const dept of departments) {
      console.log(`🔍 Fetching courses for: ${dept.name.he} (${dept.id})...`);
      
      // Pattern: /api/search/results?year=2025&faculty=7&department=XXX
      const searchUrl = `${BASE_API}/search/results?year=${ACADEMIC_YEAR}&faculty=7&department=${dept.id}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      const results = await page.evaluate(() => {
          try {
              return JSON.parse(document.body.innerText);
          } catch (e) {
              return null;
          }
      });

      if (results && results.courses) {
        console.log(`   📚 Found ${results.courses.length} courses.`);
        allCourses.push(...results.courses);
        
        // Save progress
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allCourses, null, 2));
      }

      await new Promise(r => setTimeout(r, 1000)); // Polite delay
    }

    console.log(`\n✅ Finished! Scraped ${allCourses.length} total courses.`);

  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    await browser.close();
  }
}

scrape();
