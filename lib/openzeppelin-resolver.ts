/**
 * OpenZeppelin Virtual Filesystem Resolver
 * Works in production without node_modules
 * Bundles common OpenZeppelin v5 contracts
 */

// In-memory cache for fetched contracts
const contractCache = new Map<string, string>();

// Base URL for OpenZeppelin v5.4.0 on GitHub
const OPENZEPPELIN_BASE_URL = 'https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.4.0';

// Bundled contracts - populated at build time by preloadOpenZeppelinContracts()
const BUNDLED_CONTRACTS: Record<string, string> = {};

/**
 * Resolve OpenZeppelin imports without node_modules
 * Works in production (serverless/browser environments)
 */
export async function resolveOpenZeppelinImport(importPath: string): Promise<{ contents: string } | { error: string }> {
  try {
    // Step 1: Check if bundled
    if (BUNDLED_CONTRACTS[importPath]) {
      console.log(`✅ Resolved from bundle: ${importPath}`);
      return { contents: BUNDLED_CONTRACTS[importPath] };
    }

    // Step 2: Check cache
    if (contractCache.has(importPath)) {
      console.log(`✅ Resolved from cache: ${importPath}`);
      return { contents: contractCache.get(importPath)! };
    }

    // Step 3: Try to fetch from CDN
    const githubPath = importPath.replace('@openzeppelin/contracts/', '');
    const url = `${OPENZEPPELIN_BASE_URL}/${githubPath}`;
    
    console.log(`🌐 Fetching from CDN: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contents = await response.text();
    
    // Cache it
    contractCache.set(importPath, contents);
    
    console.log(`✅ Fetched and cached: ${importPath}`);
    return { contents };
    
  } catch (error: any) {
    console.error(`❌ Failed to resolve ${importPath}:`, error.message);
    return { error: `File not found: ${importPath}` };
  }
}

/**
 * Synchronous resolver for compilation
 * Priority: 1) node_modules (localhost) 2) bundled (production) 3) cache
 */
export function resolveOpenZeppelinImportSync(importPath: string): { contents: string } | { error: string } {
  // Priority 1: Try node_modules FIRST (works on localhost, fast)
  try {
    const fs = require('fs');
    const path = require('path');
    const ozPath = path.join(process.cwd(), 'node_modules', importPath);
    
    if (fs.existsSync(ozPath)) {
      const contents = fs.readFileSync(ozPath, 'utf8');
      return { contents };
    }
  } catch (e) {
    // Filesystem not available (production), continue to next option
  }

  // Priority 2: Check bundled contracts (production deployment)
  if (BUNDLED_CONTRACTS[importPath]) {
    return { contents: BUNDLED_CONTRACTS[importPath] };
  }

  // Priority 3: Check cache (fetched from CDN previously)
  if (contractCache.has(importPath)) {
    return { contents: contractCache.get(importPath)! };
  }

  // Not found anywhere
  return { error: `File not found: ${importPath}. Run preloadOpenZeppelinContracts() at build time.` };
}

/**
 * Pre-load all OpenZeppelin contracts from node_modules (run at build time)
 * This bundles contracts into the deployment
 */
export function preloadOpenZeppelinContracts() {
  if (typeof window !== 'undefined') {
    // Browser environment, skip
    return;
  }

  try {
    const fs = require('fs');
    const path = require('path');
    
    const ozRoot = path.join(process.cwd(), 'node_modules', '@openzeppelin', 'contracts');
    
    if (!fs.existsSync(ozRoot)) {
      console.warn('⚠️ OpenZeppelin contracts not found in node_modules');
      return;
    }

    // Recursively load all .sol files
    function loadDir(dir: string, baseDir: string = ozRoot) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          loadDir(fullPath, baseDir);
        } else if (file.endsWith('.sol')) {
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const importPath = `@openzeppelin/contracts/${relativePath}`;
          const contents = fs.readFileSync(fullPath, 'utf8');
          
          BUNDLED_CONTRACTS[importPath] = contents;
        }
      }
    }

    loadDir(ozRoot);
    
    console.log(`✅ Pre-loaded ${Object.keys(BUNDLED_CONTRACTS).length} OpenZeppelin contracts`);
    
  } catch (error: any) {
    console.error('❌ Failed to pre-load OpenZeppelin contracts:', error.message);
  }
}
